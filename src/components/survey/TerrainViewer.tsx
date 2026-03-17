import {
 computeFlowDirection,
 computeFlowAccumulation,
 extractDrainage
} from "@/lib/survey/hydrology";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Delaunator from "delaunator";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DragControls } from "three/examples/jsm/controls/DragControls.js";

import { generateContours } from "@/lib/survey/generateContours";
import { generateCorridor } from "@/lib/survey/generateCorridor";
import { generatePlotLayout } from "@/lib/survey/generatePlotLayout";
import { generateBuildingLayout } from "@/lib/survey/generateBuildingLayout";
import { generateUtilities } from "@/lib/survey/generateUtilities";
import { generateCrossSections } from "@/lib/survey/generateCrossSections";
import { calculateSectionVolume } from "@/lib/survey/calcSectionVolume";
import { calculateEarthwork } from "@/lib/survey/calcEarthwork";

import { aiSitePlanner } from "@/lib/survey/aiSitePlanner";
import { aiConstructionEstimator } from "@/lib/survey/aiConstructionEstimator";
import { generateConstructionPhases } from "@/lib/survey/constructionSimulation";
import { digitalTwinMonitor } from "@/lib/survey/digitalTwinMonitor";
import { List } from "lucide-react";

interface Point {
  easting: string;
  northing: string;
  elevation: string;
}

export default function TerrainViewer({
  points,
  alignment,
  sections,
  corridor,
  verticalProfile,
  drawMode,
  setAlignment,
  setDrawMode,
  setEarthwork,
  editPlots,
  setEstimate,
  simulation,
  setTwinStatus
}: {
  points: Point[];
  alignment:any[];
  sections:any[];
  corridor:any[];
  verticalProfile: any[];
  drawMode: boolean;
  setAlignment: any;
  setDrawMode: any;
  setEarthwork: any;
  editPlots: boolean;
  setEstimate: any;
  simulation: boolean;
  setTwinStatus: any;
}) {

  const mountRef = useRef<HTMLDivElement>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [drawPoints, setDrawPoints] = useState<any[]>([]);
  const [previewPoint, setPreviewPoint] = useState<any>(null);

  useEffect(() => {

  if (!mountRef.current || points.length < 3) return;

  let previewSphere: THREE.Mesh | null = null;
  let alignmentLine: THREE.Line | null = null;

  const width = mountRef.current.clientWidth;
  const height = 450;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000);
  camera.position.set(0, -200, 150);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);

  mountRef.current.innerHTML = "";
  mountRef.current.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);

  // 🌍 TERRAIN
  const coords = points.map(p => [+p.easting, +p.northing]);
  const delaunay = Delaunator.from(coords);
  const triangles = delaunay.triangles;

  const vertices: number[] = [];

  for (let i = 0; i < triangles.length; i++) {
    const p = points[triangles[i]];
    vertices.push(+p.easting, +p.northing, +p.elevation);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();

  const terrainMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0x228b22, side: THREE.DoubleSide })
  );

  scene.add(terrainMesh);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // 🔥 MOUSE MOVE
  const handleMouseMove = (event: MouseEvent) => {

    if (!drawMode) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(terrainMesh);

    if (intersects.length > 0) {

      let p = intersects[0].point;

      // 🔥 SNAP
      let snapDistance = 5;
      let closest: any = null;
      let minDist = Infinity;

      points.forEach(pt => {
        const dx = +pt.easting - p.x;
        const dy = +pt.northing - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < snapDistance && dist < minDist) {
          minDist = dist;
          closest = pt;
        }
      });

      if (closest) {
        p = new THREE.Vector3(
          +closest.easting,
          +closest.elevation,
          +closest.northing
        );
      }

      setPreviewPoint(p);

      // 🔴 CURSOR DOT
      if (!previewSphere) {
        const geo = new THREE.SphereGeometry(1.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        previewSphere = new THREE.Mesh(geo, mat);
        scene.add(previewSphere);
      }

      previewSphere.position.copy(p);
    }
  };

  // 🔥 CLICK
  const handleClick = (event: MouseEvent) => {

    if (!drawMode) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(terrainMesh);

    if (intersects.length > 0) {

      let p = intersects[0].point;

      // 🔥 SNAP
      let snapDistance = 5;
      let closest: any = null;
      let minDist = Infinity;

      points.forEach(pt => {
        const dx = +pt.easting - p.x;
        const dy = +pt.northing - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < snapDistance && dist < minDist) {
          minDist = dist;
          closest = pt;
        }
      });

      if (closest) {
        p = new THREE.Vector3(
          +closest.easting,
          +closest.elevation,
          +closest.northing
        );
      }

      setDrawPoints(prev => [...prev, p]);
      setPreviewPoint(null);
    }
  };

  // 🔥 DOUBLE CLICK → FINISH
  const handleDoubleClick = () => {
    if (drawPoints.length < 2) return;
    setDrawMode(false);
  };

  // 🔥 ESC → CANCEL
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setDrawPoints([]);
      setPreviewPoint(null);
    }
  };

  renderer.domElement.addEventListener("mousemove", handleMouseMove);
  renderer.domElement.addEventListener("click", handleClick);
  renderer.domElement.addEventListener("dblclick", handleDoubleClick);
  window.addEventListener("keydown", handleKeyDown);

  // 🔁 LOOP
  const animate = () => {

    requestAnimationFrame(animate);

    // 🔵 DRAW LINE LIVE
    const allPoints = previewPoint
      ? [...drawPoints, previewPoint]
      : drawPoints;

    if (alignmentLine) {
      scene.remove(alignmentLine);
    }

    if (allPoints.length > 1) {

      const pts = allPoints.map(p =>
        new THREE.Vector3(p.x, p.z, p.y)
      );

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      alignmentLine = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0x00ffff })
      );

      scene.add(alignmentLine);
    }

    controls.update();
    renderer.render(scene, camera);
  };

  animate();

  // 🧹 CLEANUP
  return () => {
    renderer.domElement.removeEventListener("mousemove", handleMouseMove);
    renderer.domElement.removeEventListener("click", handleClick);
    renderer.domElement.removeEventListener("dblclick", handleDoubleClick);
    window.removeEventListener("keydown", handleKeyDown);
    renderer.dispose();
  };

}, [points, drawMode, drawPoints, previewPoint]);

useEffect(() => {

  if (drawPoints.length < 2) return;

  const alignmentData = drawPoints.map(p => ({
    x: p.x,
    y: p.z,
    z: p.y
  }));

  setAlignment(alignmentData);

}, [drawPoints]);

  useEffect(() => {

    const timer = setInterval(() => {
      setPhaseIndex(p => p + 1);
    }, 4000);

    return () => clearInterval(timer);

  }, []);

  return <div ref={mountRef} className="w-full border border-border rounded-lg" />;
}