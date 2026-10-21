import './styles.css';
import {OceanDrive} from './game/OceanDrive';
const canvas=document.querySelector<HTMLCanvasElement>('#game-canvas')!;
try {const game=new OceanDrive(canvas);if(import.meta.hot)import.meta.hot.dispose(()=>game.dispose());}
catch(error){const message=error instanceof Error?error.message:String(error);document.getElementById('error-message')!.textContent='当前设备无法初始化 3D 场景。请开启浏览器硬件加速后重试。'+message;document.getElementById('error-panel')!.classList.remove('hidden');console.error(error);}
