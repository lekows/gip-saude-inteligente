"use client";
import Link from "next/link";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { HealthUnit } from "@/types/sus";
const hospitalIcon = L.divIcon({ className: "", html: '<div style="width:32px;height:32px;border-radius:7px;display:grid;place-items:center;background:#6d398b;color:white;border:3px solid white;box-shadow:0 4px 12px #0003;font-size:14px;font-weight:800">H</div>', iconSize: [32, 32], iconAnchor: [16, 16] });
export function ProcessUnitPopup({ name, cnes }: { name: string; cnes: string }) {
  return <div className="mt-2"><strong>{name}</strong><p className="mt-1 text-xs">CNES {cnes}</p>{/^\d{7}$/.test(cnes) && <Link href={`/unidades/${cnes}/processos`} className="mt-2 inline-block rounded bg-[#1f7a4d] px-3 py-2 text-sm font-semibold !text-white">Abrir processos da unidade</Link>}</div>;
}
export function HospitalProcessMarkers({ hospitals }: { hospitals: HealthUnit[] }) {
  return <>{hospitals.map(unit => <Marker key={`process-hospital-${unit.cnes}`} position={unit.position} icon={hospitalIcon}><Tooltip>{unit.name} · Hospital · Processos</Tooltip><Popup><ProcessUnitPopup name={unit.name} cnes={unit.cnes} /></Popup></Marker>)}</>;
}
