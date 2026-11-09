"use client";
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
export default function RecordMap({points}:{points:{id:string;latitude:number;longitude:number;accuracy:number|null}[]}) {
 const div=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!div.current)return;const map=L.map(div.current).setView([-14.235,-51.925],3);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19,referrerPolicy:'no-referrer'}).addTo(map);
 for(const p of points){L.circleMarker([p.latitude,p.longitude],{radius:8,color:'#a8f065',fillColor:'#a8f065',fillOpacity:0.8}).addTo(map).bindTooltip(`Participação ${p.id.slice(0,8)}`);L.circle([p.latitude,p.longitude],{radius:Math.min(p.accuracy??0,100000),color:'#5c9cff',weight:1}).addTo(map);}
 if(points.length)map.fitBounds(L.latLngBounds(points.map(p=>[p.latitude,p.longitude])),{padding:[40,40],maxZoom:14});return()=>{map.remove();};},[points]);
 return <div className="record-map" ref={div} aria-label="Mapa das localizações autorizadas"/>;
}
