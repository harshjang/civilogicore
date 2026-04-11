import {
  computeFlowDirection,
  computeFlowAccumulation,
  extractDrainage
} from "@/lib/survey/hydrology";
import { useEffect, useRef, useState } from "react";
import Delaunator from "delaunator";
import { generateContours } from "@/lib/survey/generateContours";
import { generateCorridor } from "@/lib/survey/generateCorridor";
import { generatePlotLayout } from "@/lib/survey/generatePlotLayout";
import { generateBuildingLayout } from "@/lib/survey/generateBuildingLayout";
import { generateUtilities } from "@/lib/survey/generateUtilities";
import { generateCrossSections } from "@/lib/survey/generateCrossSections";
import { calculateSectionVolume } from "@/lib/survey/calcSectionVolume";
import { calculateEarthwork } from "@/lib/survey/calcEarthwork";
import { aiSitePlanner } from "@/lib/survey/aiSitePlanner";
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
  selectedPointId,
  setSelectedPointId,
  alignment,
  sections,
  corridor,
  verticalProfile,
  drawMode,
  setAlignment,
  setDrawMode,
  setEarthwork,
  setEstimate,
  simulation,
  setTwinStatus
}: {
  points: Point[];
  selectedPointId: string | null;
  setSelectedPointId: React.Dispatch<React.SetStateAction<string | null>>;
  alignment: any[];
  sections: any[];
  corridor: any[];
  verticalProfile: any[];
  drawMode: boolean;
  setAlignment: any;
  setDrawMode: any;
  setEarthwork: any;
  setEstimate: any;
  simulation: boolean;
  setTwinStatus: any;
}) {

  const mountRef = useRef<HTMLDivElement>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [drawPoints, setDrawPoints] = useState<any[]>([]);
  const [previewPoint, setPreviewPoint] = useState<any>(null);
  const [THREE, setTHREE] = useState<any>(null);
  const [OrbitControls, setOrbitControls] = useState<any>(null);
  const getSnappedPoint = (p: any, points: Point[], THREE: any) => {
    let snapDistance = 5;
    let closest: any = null;
    let minDist = Infinity;

    points.forEach(pt => {
      const dx = +pt.easting - p.x;
      const dz = +pt.northing - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < snapDistance && dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });

    if (closest) {
      return new THREE.Vector3(
        +closest.easting,
        +closest.elevation,
        +closest.northing
      );
    }

    return p;
  };

  useEffect(() => {
    const loadThree = async () => {
      const THREE_mod = await import("three");
      const controls_mod = await import("three/examples/jsm/controls/OrbitControls.js");

      setTHREE(THREE_mod);
      setOrbitControls(() => controls_mod.OrbitControls);
    };

    loadThree();
  }, []);

  useEffect(() => {

    if (!mountRef.current || points.length < 3 || !THREE || !OrbitControls) return;

    let previewSphere: any = null;
    let alignmentLine: any = null;

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

      vertices.push(
        +p.easting,
        +p.elevation,
        +p.northing
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0x556b2f,
        wireframe: false,
        flatShading: false
      })
    );

    scene.add(terrainMesh);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(200, -200, 300);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040);
    scene.add(ambient);

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

        p = getSnappedPoint(p, points, THREE);

        setPreviewPoint(p);

        // 🔴 CURSOR DOT
        if (!previewSphere) {
          const geo = new THREE.SphereGeometry(1.2, 16, 16);
          const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
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
          const dz = +pt.northing - p.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

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
        alignmentLine.geometry.dispose();
        scene.remove(alignmentLine);
      }

      if (drawPoints.length > 0 && previewPoint) {
        const last = drawPoints[drawPoints.length - 1];
        const dist = last.distanceTo(previewPoint);

        console.log("Distance:", dist.toFixed(2), "m");
      }

      if (allPoints.length > 1) {

        const pts = allPoints.map(p =>
          new THREE.Vector3(p.x, p.y, p.z)
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
      y: p.y,
      z: p.z
    }));

    const sec = generateCrossSections(alignmentData, 10);

    console.log("Sections:", sec);

  }, [drawPoints]);

  useEffect(() => {

    if (drawPoints.length < 2) return;

    const alignmentData = drawPoints.map(p => ({
      x: p.x,
      y: p.y,
      z: p.z
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