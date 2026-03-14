import { Line } from "react-chartjs-2"
import {
 Chart as ChartJS,
 LineElement,
 CategoryScale,
 LinearScale,
 PointElement
} from "chart.js"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

export default function RoadProfileChart({profile}:{profile:any[]}){

 const data = {
  labels: profile.map(p=>p.chainage.toFixed(1)),
  datasets:[
   {
    label:"Elevation",
    data: profile.map(p=>p.elevation),
    borderColor:"#22c55e",
    borderWidth:2,
    fill:false
   }
  ]
 }

 const options = {
  responsive:true,
  plugins:{
   legend:{display:false}
  }
 }

 return <Line data={data} options={options}/>
}