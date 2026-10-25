"use client";
import { useEffect, useRef } from "react";
export function MessageScroller({children,loading=false,className=""}:{children:React.ReactNode;loading?:boolean;className?:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:"smooth"})},[children,loading]);return <div ref={ref} className={`overflow-y-auto ${className}`}>{children}</div>}
