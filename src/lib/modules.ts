export type ModuleKey = "dashboard" | "musculacao" | "alimentacao" | "assistente" | "tempo" | "casa" | "mente" | "financas";
export type ProductModule = { key:ModuleKey; label:string; description:string; icon:string; available:boolean };
export const productModules: ProductModule[] = [
 {key:"dashboard",label:"Visão geral",description:"Seu dia e sua evolução",icon:"◫",available:true},
 {key:"musculacao",label:"Musculação",description:"Planos, sessões e progressão",icon:"⌁",available:true},
 {key:"alimentacao",label:"Alimentação",description:"Diário, catálogo, compras e prato 3D",icon:"◒",available:true},
 {key:"assistente",label:"Assistente",description:"Orientação com seus próprios dados",icon:"✦",available:true},
 {key:"tempo",label:"Tempo",description:"Ritmos, agenda e foco",icon:"◷",available:false},
 {key:"casa",label:"Casa",description:"Espaços e rotinas",icon:"⌂",available:false},
 {key:"mente",label:"Mente",description:"Pausas e presença",icon:"◌",available:false},
 {key:"financas",label:"Finanças",description:"Clareza para escolhas",icon:"◈",available:false},
];
