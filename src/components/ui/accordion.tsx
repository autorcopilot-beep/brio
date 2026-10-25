"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
export function Accordion({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={className}>{children}</div>}
export function AccordionItem({title,children,open=false}:{title:string;children:React.ReactNode;open?:boolean}){const [expanded,setExpanded]=useState(open);return <div className="border-b border-[#e9e3db] last:border-0"><button type="button" onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded} className="flex w-full items-center justify-between py-3 text-left text-sm font-bold"><span>{title}</span><ChevronDown size={16} className={`transition-transform ${expanded?"rotate-180":""}`}/></button>{expanded&&<div className="pb-3 text-sm text-[#5e5a56]">{children}</div>}</div>}
