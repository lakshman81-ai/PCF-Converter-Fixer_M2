import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';
import { applyFixes } from '../../engine/FixApplicator';
import { createLogger as Logger } from '../../utils/Logger';

// ----------------------------------------------------
// Performance Optimized Instanced Pipes Rendering
// ----------------------------------------------------
const InstancedPipes = () => {
  const getPipes = useStore(state => state.getPipes);
  const setSelected = useStore(state => state.setSelected);
  const pipes = getPipes();
  const meshRef = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || pipes.length === 0) return;

    pipes.forEach((element, i) => {
      const { ep1, ep2, bore } = element;
      if (!ep1 || !ep2) return;

      const vecA = new THREE.Vector3(ep1.x, ep1.y, ep1.z);
      const vecB = new THREE.Vector3(ep2.x, ep2.y, ep2.z);
      const distance = vecA.distanceTo(vecB);
      if (distance === 0) return;

      const midPoint = vecA.clone().lerp(vecB, 0.5);
      dummy.position.copy(midPoint);

      const radius = bore ? bore / 2 : 5;
      dummy.scale.set(radius, distance, radius);

      const direction = vecB.clone().sub(vecA).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      dummy.quaternion.copy(quaternion);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Store the element ID in user data for raycasting selection
      meshRef.current.userData = meshRef.current.userData || {};
      meshRef.current.userData[i] = element._rowIndex || element.id;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [pipes, dummy]);

  const handleClick = (e) => {
      e.stopPropagation();
      if (e.instanceId !== undefined) {
          const clickedId = meshRef.current.userData[e.instanceId];
          setSelected(clickedId);
      }
  };

  return (
    <instancedMesh ref={meshRef} args={[null, null, pipes.length]} onClick={handleClick}>
      <cylinderGeometry args={[1, 1, 1, 16]} />
      <meshStandardMaterial color="#64748b" />
    </instancedMesh>
  );
};

// ----------------------------------------------------
// Highlight Wireframe for Selected Element
// ----------------------------------------------------
const HighlightMesh = () => {
    const selectedId = useStore(state => state.selectedElementId);
    const dataTable = useStore(state => state.dataTable);

    if (!selectedId) return null;

    const selectedEl = dataTable.find(r => r.id === selectedId || r._rowIndex === selectedId);
    if (!selectedEl || !selectedEl.ep1 || !selectedEl.ep2) return null;

    const vecA = new THREE.Vector3(selectedEl.ep1.x, selectedEl.ep1.y, selectedEl.ep1.z);
    const vecB = new THREE.Vector3(selectedEl.ep2.x, selectedEl.ep2.y, selectedEl.ep2.z);
    const distance = vecA.distanceTo(vecB);
    const midPoint = vecA.clone().lerp(vecB, 0.5);
    const radius = (selectedEl.bore ? selectedEl.bore / 2 : 5) * 1.5; // Slightly larger

    const direction = vecB.clone().sub(vecA).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

    return (
        <mesh position={midPoint} quaternion={quaternion}>
            <cylinderGeometry args={[radius, radius, distance + 10, 16]} />
            <meshBasicMaterial color="#eab308" wireframe={true} />
        </mesh>
    );
};

// ----------------------------------------------------
// Camera Tweening Controller
// ----------------------------------------------------
const CameraController = ({ controlsRef }) => {
    const selectedId = useStore(state => state.selectedElementId);
    const dataTable = useStore(state => state.dataTable);

    const targetPos = useRef(new THREE.Vector3());
    const cameraTargetPos = useRef(new THREE.Vector3());
    const isAnimating = useRef(false);

    useEffect(() => {
        if (!selectedId) return;
        const selectedEl = dataTable.find(r => r.id === selectedId || r._rowIndex === selectedId);
        if (selectedEl && selectedEl.ep1) {
            let center;
            if (selectedEl.ep2) {
                center = new THREE.Vector3(
                    (selectedEl.ep1.x + selectedEl.ep2.x) / 2,
                    (selectedEl.ep1.y + selectedEl.ep2.y) / 2,
                    (selectedEl.ep1.z + selectedEl.ep2.z) / 2
                );
            } else {
                center = new THREE.Vector3(selectedEl.ep1.x, selectedEl.ep1.y, selectedEl.ep1.z);
            }

            targetPos.current.copy(center);
            cameraTargetPos.current.set(center.x + 500, center.y + 500, center.z + 500);
            isAnimating.current = true;
        }
    }, [selectedId, dataTable]);

    useFrame((state, delta) => {
        if (!isAnimating.current || !controlsRef.current) return;

        THREE.MathUtils.damp3(state.camera.position, cameraTargetPos.current, 4, delta);
        THREE.MathUtils.damp3(controlsRef.current.target, targetPos.current, 4, delta);
        controlsRef.current.update();

        if (state.camera.position.distanceTo(cameraTargetPos.current) < 5) {
            isAnimating.current = false;
        }
    });

    return null;
};

// ----------------------------------------------------
// Gap/Proposal Visualization with Physical Mutation
// ----------------------------------------------------
const ProposalOverlay = ({ proposal }) => {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  const setProposalStatus = useStore(state => state.setProposalStatus);
  const setDataTable = useStore(state => state.setDataTable);
  const { state: appState, dispatch } = useAppContext();

  const { elementA, elementB, description, _fixApproved } = proposal;

  if (!elementA.ep2 || !elementB.ep1) return null;

  const pA = [elementA.ep2.x, elementA.ep2.y, elementA.ep2.z];
  const pB = [elementB.ep1.x, elementB.ep1.y, elementB.ep1.z];

  const midX = (pA[0] + pB[0]) / 2;
  const midY = (pA[1] + pB[1]) / 2;
  const midZ = (pA[2] + pB[2]) / 2;

  const handleApproveAndMutate = (e) => {
      e.stopPropagation();

      // 1. Mark as approved in Zustand visual store
      setProposalStatus(elementA._rowIndex, true);

      // 2. Mark as approved in a cloned Global state table
      const updatedTable = appState.dataTable.map(r =>
          r._rowIndex === elementA._rowIndex ? { ...r, _fixApproved: true } : r
      );

      // 3. Run the physics engine instantly
      const logger = Logger();
      const result = applyFixes(updatedTable, appState.smartFix.chains, appState.config, logger);

      // 4. Update Global Context
      dispatch({ type: "SET_DATA_TABLE", payload: result.updatedTable });
      dispatch({ type: "SET_SMART_FIX_STATUS", status: "applied" });

      // 5. Force the 3D Canvas to re-render the new solid geometry
      setDataTable(result.updatedTable);
      setClicked(false);
  };

  const handleReject = (e) => {
      e.stopPropagation();
      setProposalStatus(elementA._rowIndex, false);
      setClicked(false);
  };

  return (
    <group>
      <Line
        points={[pA, pB]}
        color={hovered ? "#fcd34d" : "#ef4444"}
        lineWidth={3}
        dashed={true}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
      />

      {!clicked && (
        <Text
          position={[midX, midY + 150, midZ]}
          color="#ef4444"
          fontSize={80}
          anchorX="center"
          anchorY="middle"
        >
          {Math.round(new THREE.Vector3(...pA).distanceTo(new THREE.Vector3(...pB)))}mm
        </Text>
      )}

      {clicked && (
        <Html position={[midX, midY, midZ]} center zIndexRange={[100, 0]}>
          <div className={`p-3 rounded-lg shadow-xl text-xs w-64 border backdrop-blur-md ${
             _fixApproved === true ? 'bg-green-900 border-green-500/50' :
             _fixApproved === false ? 'bg-slate-900 border-slate-500/50' :
             'bg-slate-800 border-red-500/50'
          }`}>
            <p className={`font-bold mb-1 border-b pb-1 ${
                _fixApproved === true ? 'text-green-400 border-green-700' :
                _fixApproved === false ? 'text-slate-400 border-slate-700' :
                'text-red-400 border-slate-700'
            }`}>
                {_fixApproved === true ? 'Proposal Approved' : _fixApproved === false ? 'Proposal Rejected' : 'Topology Anomaly'}
            </p>
            <p className={`mb-3 leading-relaxed ${_fixApproved === false ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{description}</p>
            <div className="flex gap-2">
              <button
                className={`text-white px-2 py-1.5 rounded w-full transition-colors ${
                    _fixApproved === true ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-green-600'
                }`}
                onClick={handleApproveAndMutate}
              >
                ✓ Approve & Snap
              </button>
              <button
                className={`text-white px-2 py-1.5 rounded w-full transition-colors ${
                    _fixApproved === false ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-700 hover:bg-red-600'
                }`}
                onClick={handleReject}
              >
                ✗ Reject
              </button>
            </div>
            <button className="mt-2 text-slate-400 hover:text-slate-200 text-[10px] w-full text-right" onClick={(e) => { e.stopPropagation(); setClicked(false); }}>Close</button>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// Main Tab Component
// ----------------------------------------------------
const ControlsAutoCenter = () => {
    const controlsRef = useRef();
    const getPipes = useStore(state => state.getPipes);

    useEffect(() => {
        const handleFocus = (e) => {
            if (!controlsRef.current) return;
            const { x, y, z, dist } = e.detail;
            controlsRef.current.target.set(x, y, z);
            controlsRef.current.object.position.set(x + dist, y + dist, z + dist);
            controlsRef.current.update();
        };

        const handleAutoCenter = () => {
            if (!controlsRef.current) return;
            const pipes = getPipes();
            if (pipes.length === 0) return;

            const box = new THREE.Box3();
            pipes.forEach(p => {
                if (p.ep1) box.expandByPoint(new THREE.Vector3(p.ep1.x, p.ep1.y, p.ep1.z));
                if (p.ep2) box.expandByPoint(new THREE.Vector3(p.ep2.x, p.ep2.y, p.ep2.z));
            });

            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);

            controlsRef.current.target.copy(center);
            controlsRef.current.object.position.set(center.x + maxDim, center.y + maxDim, center.z + maxDim);
            controlsRef.current.update();
        };

        window.addEventListener('canvas-focus', handleFocus);
        window.addEventListener('canvas-auto-center', handleAutoCenter);

        return () => {
            window.removeEventListener('canvas-focus', handleFocus);
            window.removeEventListener('canvas-auto-center', handleAutoCenter);
        };
    }, [getPipes]);

    return <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1} />;
};

export function CanvasTab() {
  const proposals = useStore(state => state.proposals);
  const setSelected = useStore(state => state.setSelected);
  const controlsRef = useRef();

  const handleAutoCenter = () => {
      window.dispatchEvent(new CustomEvent('canvas-auto-center'));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-800 shadow-inner relative">

      {/* Canvas Overlay UI */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-slate-200 font-bold text-lg drop-shadow-md">3D Topology Canvas</h2>
        <p className="text-slate-400 text-xs mt-1">Right-click pan, Scroll zoom, Left-click rotate</p>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <button
            onClick={handleAutoCenter}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-700 shadow flex items-center gap-2 text-sm transition-colors"
            title="Auto Center Camera"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"></path><path d="M21 3v5h-5"></path><path d="M21 21v-5h-5"></path><path d="M3 21v-5h5"></path><path d="M10 10h4v4h-4z"></path></svg>
            Auto Center
        </button>
      </div>

      {/* R3F WebGL Canvas */}
      <div className="flex-1 w-full h-full relative" onPointerMissed={() => setSelected(null)}>
        <Canvas camera={{ position: [5000, 5000, 5000], fov: 50 }}>

          <CameraController controlsRef={controlsRef} />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <InstancedPipes />
          <HighlightMesh />

          {proposals.map((prop, idx) => (
            <ProposalOverlay key={`prop-${idx}`} proposal={prop} />
          ))}

          <ControlsAutoCenter />

          <gridHelper args={[100000, 100, '#1e293b', '#0f172a']} position={[0, -1000, 0]} />
        </Canvas>
      </div>

    </div>
  );
}
