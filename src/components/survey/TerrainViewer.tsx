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

interface Point {
  easting: string;
  northing: string;
  elevation: string;
}

export default function TerrainViewer({
  points,
  setEarthwork,
  editPlots,
  setEstimate,
  simulation,
  setTwinStatus
}: {
  points: Point[];
  setEarthwork: any;
  editPlots: boolean;
  setEstimate: any;
  simulation: boolean;
  setTwinStatus: any;
}) {

  const mountRef = useRef<HTMLDivElement>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {

    if (!mountRef.current || points.length < 3) return;

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
    controls.enableDamping = true;

    const coords = points.map(p => [
      +p.easting,
      +p.northing
    ]);

    const terrainPoints = points.map(p=>({
 x:+p.easting,
 y:+p.northing,
 z:+p.elevation
}))

    const flow = computeFlowDirection(terrainPoints)

const accumulation = computeFlowAccumulation(flow)

const streams = extractDrainage(
 terrainPoints,
 flow,
 accumulation
)

    const delaunay = Delaunator.from(coords);
    const triangles = delaunay.triangles;

    const vertices: number[] = [];

    for (let i = 0; i < triangles.length; i++) {
      const p = points[triangles[i]];
      vertices.push(
        +p.easting,
        +p.northing,
        +p.elevation
      );
    }

    const slopes:number[] = [];

for(let i=0;i<triangles.length;i+=3){

 const p1 = points[triangles[i]];
 const p2 = points[triangles[i+1]];
 const p3 = points[triangles[i+2]];

 const z1 = +p1.elevation;
 const z2 = +p2.elevation;
 const z3 = +p3.elevation;

 const avgSlope = Math.abs((z1+z2+z3)/3);

 slopes.push(avgSlope,avgSlope,avgSlope);

}

    const colors:number[] = [];

slopes.forEach(s=>{

 let r=0,g=0,b=0;

 if(s < 1){
  g = 1;          // flat = green
 }
 else if(s < 3){
  r = 1;
  g = 1;          // medium = yellow
 }
 else{
  r = 1;          // steep = red
 }

 colors.push(r,g,b)

})

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setAttribute(
 "color",
 new THREE.Float32BufferAttribute(colors,3)
)

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors:true,
      side: THREE.DoubleSide
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    scene.add(terrainMesh);

    // Drag Controls
    const dragControls = new DragControls(
      scene.children,
      camera,
      renderer.domElement
    );

    dragControls.addEventListener("drag", (event: any) => {
      event.object.position.z = 0;
    });

    // Cross Sections
    const sections = generateCrossSections(points, 5);

    sections.forEach(sec => {

      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sec.left.x, sec.left.y, sec.left.z),
        new THREE.Vector3(sec.right.x, sec.right.y, sec.right.z)
      ]);

      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0xffff00 })
      );

      scene.add(line);
    });

    // Earthwork
    const volumes = sections.map(sec =>
      calculateSectionVolume(sec, 105)
    );

    const earthwork = {
      cut: volumes.reduce((s, v) => s + v.cut, 0),
      fill: volumes.reduce((s, v) => s + v.fill, 0),
      net: volumes.reduce((s, v) => s + v.fill - v.cut, 0)
    };

    setEarthwork(earthwork);

    // Contours
    const contours = generateContours(points, 1);

    const contourMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

contours.forEach(contour => {

  const verts: number[] = [];

  contour.points.forEach(p => {
    verts.push(p.x, p.y, p.z);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(verts,3)
  );

  const line = new THREE.Line(geometry, contourMaterial);

  scene.add(line);

});

    streams.forEach(stream=>{

 const geo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(stream.start.x,stream.start.y,stream.start.z),
  new THREE.Vector3(stream.end.x,stream.end.y,stream.end.z)
 ])

 const line = new THREE.Line(
  geo,
  new THREE.LineBasicMaterial({color:0x0000ff})
 )

 scene.add(line)

})

    // Corridor
    const corridor = generateCorridor(points, 10);

    const roadVertices: number[] = [];

    for (let i = 0; i < corridor.length - 1; i++) {

      const a = corridor[i];
      const b = corridor[i + 1];

      roadVertices.push(
        a.left.x, a.left.y, a.left.z,
        a.right.x, a.right.y, a.right.z,
        b.left.x, b.left.y, b.left.z
      );

      roadVertices.push(
        b.left.x, b.left.y, b.left.z,
        a.right.x, a.right.y, a.right.z,
        b.right.x, b.right.y, b.right.z
      );
    }

    const roadGeometry = new THREE.BufferGeometry();
    roadGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(roadVertices, 3)
    );

    roadGeometry.computeVertexNormals();

    const roadMesh = new THREE.Mesh(
      roadGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        side: THREE.DoubleSide
      })
    );

    scene.add(roadMesh);

    // Plot Layout
    const plots = generatePlotLayout(points, 20, 30);

    plots.forEach(plot => {

      const pts = plot.corners.map(p =>
        new THREE.Vector3(p.x, p.y, 0)
      );

      pts.push(new THREE.Vector3(
        plot.corners[0].x,
        plot.corners[0].y,
        0
      ));

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0xffffff })
      );

      scene.add(line);
    });

    // Buildings
    const buildings = plots.map(p => generateBuildingLayout(p, 3));

    buildings.forEach(building => {

      const pts = building.map(p =>
        new THREE.Vector3(p.x, p.y, 0)
      );

      pts.push(new THREE.Vector3(
        building[0].x,
        building[0].y,
        0
      ));

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0x00ffff })
      );

      scene.add(line);
    });

    // Utilities
    const utilities = generateUtilities([], plots);

    // AI Planning
    const rules = {
      plotWidth: 20,
      plotDepth: 30,
      roadWidth: 8,
      setback: 3
    };

    const plan = aiSitePlanner(points, rules);
    const estimate = aiConstructionEstimator(plan);

    setEstimate(estimate);

    const phases = generateConstructionPhases(plan);

    const twinStatus = digitalTwinMonitor(plan, {
      roads: [],
      buildings: []
    });

    setTwinStatus(twinStatus);

    // Lights
    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(100, 100, 200);
    scene.add(light1);

    scene.add(new THREE.AmbientLight(0x404040));

    controls.addEventListener("change", () => {
 renderer.render(scene,camera)
})

renderer.render(scene,camera);

    return () => renderer.dispose();

  }, [points, editPlots, simulation]);

  useEffect(() => {

    const timer = setInterval(() => {
      setPhaseIndex(p => p + 1);
    }, 4000);

    return () => clearInterval(timer);

  }, []);

  return <div ref={mountRef} className="w-full border border-border rounded-lg" />;
}