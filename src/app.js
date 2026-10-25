import './styles.css';
import {store} from './store.js';
import {setupNotify,updateSchedule} from './notify.js';
import {sharePlant,shareGardenPlan} from './share.js';
import {initAccount} from './account.js';
import {cloudOn,currentUser} from './cloud.js';
import {createLink,sendLink} from './links.js';
import {initPlan} from './plan.js';
import {loadWx,fetchWx,isFresh,capital,rainSince,rainSoon,hotNow,coldest,hottest,next as wxNext,sky,FROST_C,HEAT_C} from './weather.js';
const ILUS=import.meta.env.BASE_URL+'ilus/';

const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_L=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
// Provincias: medias mensuales aproximadas de la capital (temperatura °C y horas de sol al día)
const ZONES={
  almeria:{name:'Almería',reg:'Andalucía',alt:21,t:[12.5,13.1,14.8,16.4,19.1,22.8,25.9,26.5,24.1,20.2,16.3,13.6],sun:[6,6.8,7.4,8.4,9.8,10.6,11,10.2,8.6,7.1,6.1,5.6]},
  cadiz:{name:'Cádiz',reg:'Andalucía',alt:2,t:[12.8,13.6,15.4,16.6,19,22.1,24.3,24.8,23.3,20.4,16.5,13.9],sun:[5.9,6.6,7.3,8.7,10.2,11.2,11.8,11.1,9,7.3,6.1,5.4]},
  cordoba:{name:'Córdoba',reg:'Andalucía',alt:90,t:[9.5,11.2,14.2,16.4,20.6,25.6,28.6,28.1,24.4,19.1,13.7,10.2],sun:[5.4,6.4,6.9,8.2,9.6,11.3,12.1,11.3,8.9,6.8,5.7,4.8]},
  granada:{name:'Granada',reg:'Andalucía',alt:690,t:[6.8,8.3,11.1,13,17.1,22.4,25.5,25.2,21.4,15.8,10.8,7.6],sun:[5.8,6.5,7,7.9,9.5,11,11.7,10.9,8.6,7,5.9,5.4]},
  huelva:{name:'Huelva',reg:'Andalucía',alt:20,t:[11.6,12.6,15,16.6,19.5,23.1,25.8,25.6,23.4,19.7,15.4,12.6],sun:[5.9,6.6,7.4,8.8,10.4,11.4,12,11.2,9,7.3,6,5.3]},
  jaen:{name:'Jaén',reg:'Andalucía',alt:580,t:[8.8,10.2,13,15,19.4,24.8,28.4,28,23.6,17.8,12.6,9.4],sun:[5.2,6,6.6,7.6,9.3,11,11.8,11,8.6,6.6,5.4,4.7]},
  malaga:{name:'Málaga',reg:'Andalucía',alt:7,t:[12.4,13,14.7,16.4,19.3,23,25.5,26.1,23.7,19.6,15.6,13],sun:[5.9,6.4,7,8.1,9.5,10.8,11.2,10.5,8.6,6.8,6,5.4]},
  sevilla:{name:'Sevilla',reg:'Andalucía',alt:34,t:[10.9,12.4,15.6,17.6,21.2,25.6,28.2,28,25,20.4,15.2,11.8],sun:[5.8,6.6,7,8.4,9.8,11.2,11.8,11,8.8,7,5.9,5.2]},
  huesca:{name:'Huesca',reg:'Aragón',alt:540,t:[4.6,6.6,9.8,11.8,16,20.6,23.8,23.4,19.6,14.4,8.6,5.2],sun:[4,5.5,6.6,7.3,8.6,9.8,10.7,9.7,7.6,6,4.4,3.6]},
  teruel:{name:'Teruel',reg:'Aragón',alt:900,t:[3.8,5,8,10,14,18.6,22,21.6,17.8,12.6,7.2,4.4],sun:[5.2,6,6.8,7.4,8.6,10,10.8,9.8,7.8,6.4,5.2,4.6]},
  zaragoza:{name:'Zaragoza',reg:'Aragón',alt:250,t:[6.6,8.4,11.6,13.8,18.2,22.6,25.4,25,21,15.8,10,6.9],sun:[4.4,5.9,6.8,7.6,8.8,10.2,11,10,7.8,6.2,4.6,3.8]},
  asturias:{name:'Asturias (Oviedo)',reg:'Asturias',alt:336,t:[7.9,8.6,10,10.9,13.4,16.5,18.6,19.2,17.6,14.5,10.6,8.7],sun:[3.4,3.8,4.4,5,5.6,5.8,6,5.8,5,4.2,3.4,3]},
  baleares:{name:'Baleares (Palma)',reg:'Baleares',alt:3,t:[11.6,11.8,13.4,15.4,19,23.2,26.2,26.6,23.6,19.8,15.6,12.8],sun:[5.2,6,6.6,7.6,9.2,10.2,11,10.2,8,6.6,5.4,4.8]},
  laspalmas:{name:'Las Palmas',reg:'Canarias',alt:25,t:[18,18.2,18.8,19.2,20.2,21.6,23,24,24,23,21.2,19.2],sun:[6.4,6.8,7.4,7.8,8.6,8.8,8.8,8.6,7.8,7,6.4,5.8]},
  tenerife:{name:'Santa Cruz de Tenerife',reg:'Canarias',alt:35,t:[18.2,18.2,19,19.6,21,22.8,24.8,25.4,24.6,23.2,21,19.2],sun:[6,6.6,7.2,7.8,9.2,10.2,10.8,10.2,8.4,7,6,5.6]},
  cantabria:{name:'Cantabria (Santander)',reg:'Cantabria',alt:52,t:[9.8,10,11.4,12.4,14.8,17.6,19.6,20,18.6,16.2,12.6,10.6],sun:[2.8,3.4,4.2,4.8,5.6,5.8,6.2,6,5.2,4,3,2.6]},
  albacete:{name:'Albacete',reg:'Castilla-La Mancha',alt:690,t:[5.2,6.6,9.6,11.8,16,21.2,24.6,24.2,20,14.4,8.8,5.6],sun:[5,6,6.8,7.8,9.2,10.8,11.8,10.8,8.4,6.6,5.2,4.4]},
  ciudadreal:{name:'Ciudad Real',reg:'Castilla-La Mancha',alt:630,t:[5.8,7.6,10.4,12.6,16.8,22.4,26,25.6,21.2,15.2,9.6,6.4],sun:[4.8,5.8,6.4,7.6,9.2,10.8,11.8,11,8.6,6.4,5,4.2]},
  cuenca:{name:'Cuenca',reg:'Castilla-La Mancha',alt:950,t:[4.2,5.4,8.2,10.4,14.4,19.4,22.8,22.4,18.4,12.8,7.8,4.8],sun:[4.6,5.6,6.4,7.2,8.6,10.2,11.2,10.4,8,6.2,4.8,4]},
  guadalajara:{name:'Guadalajara',reg:'Castilla-La Mancha',alt:680,t:[5.6,7.2,10,12.2,16.2,21.4,24.8,24.2,20,14.4,8.8,6],sun:[4.6,5.6,6.4,7.4,8.8,10.4,11.6,10.8,8.4,6.2,4.8,4]},
  toledo:{name:'Toledo',reg:'Castilla-La Mancha',alt:515,t:[6.6,8.4,11.6,13.8,18,23.4,27.2,26.6,22.4,16.2,10.4,7.2],sun:[4.8,5.8,6.6,7.6,9,10.8,11.8,11,8.6,6.4,5,4.2]},
  avila:{name:'Ávila',reg:'Castilla y León',alt:1130,t:[3.2,4.2,6.6,8.4,12.2,16.8,20.2,20,16.4,11.2,6.4,3.8],sun:[4.4,5.4,6.2,7,8.6,10.4,11.6,10.8,8.2,6,4.6,3.8]},
  burgos:{name:'Burgos',reg:'Castilla y León',alt:890,t:[3,4.2,6.6,8.4,12,16.2,19.4,19.4,16.2,11.4,6.4,3.8],sun:[3,4.2,5.4,6.4,7.6,9.2,10.4,9.6,7.4,5.4,3.6,2.8]},
  leon:{name:'León',reg:'Castilla y León',alt:910,t:[3.2,4.6,7.4,9.2,12.8,17.2,20.2,19.8,16.6,11.6,6.6,4],sun:[3.8,5,6.2,6.8,8,9.6,10.8,10,7.8,5.6,4,3.2]},
  palencia:{name:'Palencia',reg:'Castilla y León',alt:740,t:[3.8,5.4,8.2,10,13.8,18.2,21.4,21.2,17.6,12.4,7,4.4],sun:[3.4,4.8,6,7,8.4,10,11.2,10.4,8,5.6,3.8,3]},
  salamanca:{name:'Salamanca',reg:'Castilla y León',alt:790,t:[3.8,5.4,8.2,10.2,14,18.6,21.8,21.4,17.8,12.4,7,4.4],sun:[3.8,5,6.2,7,8.4,10.2,11.6,10.8,8.4,6,4.2,3.4]},
  segovia:{name:'Segovia',reg:'Castilla y León',alt:1000,t:[4,5.2,7.6,9.4,13.4,18.2,21.8,21.4,17.6,12,7,4.6],sun:[4.4,5.4,6.2,7,8.4,10.2,11.4,10.6,8.2,6,4.6,3.8]},
  soria:{name:'Soria',reg:'Castilla y León',alt:1080,t:[2.8,4,6.4,8.4,12.2,16.8,20.2,19.8,16.2,11,6,3.4],sun:[4.2,5.2,6.2,7,8.2,9.8,11,10.2,8,6,4.4,3.6]},
  valladolid:{name:'Valladolid',reg:'Castilla y León',alt:700,t:[4,5.8,8.6,10.6,14.4,19,22.2,21.8,18.2,12.8,7.4,4.6],sun:[3.2,4.8,6.2,7.2,8.6,10.4,11.6,10.8,8.4,6,3.8,2.8]},
  zamora:{name:'Zamora',reg:'Castilla y León',alt:660,t:[4.4,6.2,9,11,14.8,19.4,22.6,22.2,18.6,13.2,7.8,5],sun:[3.4,5,6.4,7.4,8.8,10.6,11.8,11,8.6,6.2,4,3]},
  barcelona:{name:'Barcelona',reg:'Cataluña',alt:12,t:[9.2,9.8,11.8,13.6,17,21,24,24.4,21.6,17.6,13,10],sun:[4.8,5.8,6.4,7.4,8.4,9,9.8,9,7.2,6,4.8,4.4]},
  girona:{name:'Girona',reg:'Cataluña',alt:95,t:[6.8,7.8,10.2,12.2,16,20.2,23.2,23,19.8,15.4,10.4,7.6],sun:[4.8,5.6,6.4,7.2,8,9.2,10.2,9.2,7.2,6,5,4.4]},
  lleida:{name:'Lleida',reg:'Cataluña',alt:190,t:[5.4,7.8,11,13.6,17.8,22.2,25,24.6,20.6,15.2,9,5.6],sun:[3.6,5.6,6.8,7.8,9,10.2,11,10,7.8,6.2,4.2,3]},
  tarragona:{name:'Tarragona',reg:'Cataluña',alt:55,t:[10,10.8,12.8,14.8,18.2,22,25,25.4,22.4,18.4,13.8,10.8],sun:[5,5.8,6.6,7.4,8.4,9.6,10.4,9.4,7.6,6.2,5,4.6]},
  alicante:{name:'Alicante',reg:'Comunidad Valenciana',alt:80,t:[11.6,12.4,14.2,16,19,22.8,25.6,26,23.6,19.6,15.4,12.6],sun:[6,6.6,7,8,9.2,10.4,11.2,10.2,8.4,7,6,5.4]},
  castellon:{name:'Castellón',reg:'Comunidad Valenciana',alt:35,t:[10.6,11.4,13.2,15,18.2,22.2,25,25.4,22.8,18.8,14.2,11.4],sun:[5.4,6,6.6,7.4,8.4,9.6,10.4,9.4,7.6,6.4,5.4,5]},
  valencia:{name:'Valencia',reg:'Comunidad Valenciana',alt:11,t:[11,12,14,15.8,18.8,22.6,25.4,25.8,23.4,19.6,14.8,12],sun:[5.4,6.2,6.6,7.6,8.6,9.6,10.4,9.6,7.8,6.6,5.4,4.8]},
  badajoz:{name:'Badajoz',reg:'Extremadura',alt:185,t:[8.8,10.6,13.6,15.6,19.4,24.6,27.6,27.2,23.6,18,12.6,9.6],sun:[5,6,6.6,8,9.4,11.2,12.2,11.4,8.8,6.6,5.2,4.4]},
  caceres:{name:'Cáceres',reg:'Extremadura',alt:405,t:[8,9.6,12.4,14.2,18.2,23.4,26.8,26.4,22.6,16.8,11.4,8.6],sun:[4.8,5.8,6.4,7.8,9.2,11,12,11.2,8.6,6.4,5,4.2]},
  coruna:{name:'A Coruña',reg:'Galicia',alt:60,t:[10.4,10.6,11.8,12.6,14.6,17.2,19,19.6,18.6,16,12.8,11],sun:[3.4,4.2,5.2,6,6.8,7.6,8,7.8,6.4,4.8,3.6,3]},
  lugo:{name:'Lugo',reg:'Galicia',alt:450,t:[6,7,8.8,10,12.8,16.2,18.2,18.4,16.6,12.8,8.6,6.6],sun:[2.8,3.6,4.8,5.6,6.6,7.6,8.6,8.4,6.4,4.6,3.2,2.4]},
  ourense:{name:'Ourense',reg:'Galicia',alt:140,t:[7.6,9,11.4,13.2,16.6,20.6,23,22.8,20,15.2,10.6,8],sun:[2.8,4,5.2,6.4,7.6,9,10,9.6,7.2,5,3.2,2.4]},
  pontevedra:{name:'Pontevedra',reg:'Galicia',alt:20,t:[9.8,10.6,12.6,13.6,16,19,20.8,21,19.4,16.2,12.6,10.4],sun:[3.4,4.2,5.4,6.4,7.4,8.6,9.4,9,7,5,3.6,3]},
  rioja:{name:'La Rioja (Logroño)',reg:'La Rioja',alt:380,t:[5.8,7.4,10.2,12.2,15.8,20,22.8,22.6,19.2,14.4,9,6.2],sun:[3.4,4.6,5.8,6.6,7.8,9.2,10.2,9.4,7.6,5.6,3.8,3]},
  madrid:{name:'Madrid',reg:'Madrid',alt:667,t:[6.2,7.8,10.8,12.6,16.6,22,25.4,24.8,20.6,14.8,9.6,6.8],sun:[4.8,5.8,6.6,7.6,8.8,10.6,11.8,11,8.4,6.4,5,4.2]},
  murcia:{name:'Murcia',reg:'Murcia',alt:60,t:[10.6,11.6,13.8,15.8,19.4,23.6,26.6,27,24,19.4,14.6,11.4],sun:[5.6,6.2,7,7.8,9,10.4,11.2,10.2,8.4,6.8,5.8,5.2]},
  navarra:{name:'Navarra (Pamplona)',reg:'Navarra',alt:450,t:[4.6,5.8,8.6,10.4,14,18,20.8,20.8,17.8,13.2,8,5.4],sun:[3,4.2,5.2,5.8,7,8.4,9.4,8.8,7,5,3.4,2.6]},
  alava:{name:'Álava (Vitoria)',reg:'País Vasco',alt:510,t:[4.6,5.6,8,9.6,13,16.6,19.2,19.4,16.8,12.8,7.8,5.2],sun:[2.8,3.8,4.8,5.4,6.6,7.6,8.4,8,6.4,4.6,3.2,2.4]},
  bizkaia:{name:'Bizkaia (Bilbao)',reg:'País Vasco',alt:40,t:[8.8,9.6,11.6,12.8,15.8,18.6,20.6,21,19.4,16.4,11.8,9.6],sun:[2.8,3.4,4.4,4.8,5.8,6.2,6.6,6.4,5.4,4.2,3,2.4]},
  gipuzkoa:{name:'Gipuzkoa (San Sebastián)',reg:'País Vasco',alt:10,t:[8.6,9,10.8,12,14.8,17.6,19.8,20.2,18.8,16,11.6,9.4],sun:[2.8,3.4,4.2,4.6,5.6,5.8,6.2,6,5.2,4.2,3,2.4]},
  ceuta:{name:'Ceuta',reg:'Ceuta y Melilla',alt:5,t:[14,14,15,16,18.2,21,23.4,24,22.4,19.8,16.6,14.8],sun:[5.6,6.2,6.8,7.8,9,10,10.6,10,8.4,6.8,5.8,5.2]},
  melilla:{name:'Melilla',reg:'Ceuta y Melilla',alt:10,t:[13.6,14,15.2,16.6,19.2,22.4,25.2,26,23.8,20.4,16.8,14.4],sun:[6,6.6,7,8,9.2,10,10.6,10,8.4,7,6,5.6]}
};
// Zonas antiguas (5 regiones) a provincia equivalente
const OLD_ZONES={sur:'sevilla',med:'valencia',centro:'madrid',norte:'asturias',canarias:'laspalmas'};
// Clima de la zona elegida, ajustado a la altitud del huerto (unos 0,65 °C menos por cada 100 m)
function zoneNow(){const b=ZONES[state.zone]||ZONES.sevilla;const a=state.alt;if(a==null||isNaN(a)||a===b.alt)return b;
  const d=(a-b.alt)*0.0065;return {...b,t:b.t.map(x=>Math.round((x-d)*10)/10)}}
const GROUPS={alimentario:'Cultivos alimentarios',frutal:'Frutales',aromatica:'Aromáticas y medicinales',forrajero:'Cultivos forrajeros',ornamental:'Ornamentales'};
// tMin/tMax: media mensual del aire para sembrar fuera; sun: horas de sol/día deseables; days: días a cosecha o floración
// care: días entre riegos (base), abono, cambio de sustrato
const SPECIES=[
 {id:'tomate',n:'Tomate',g:'alimentario',tMin:16,tMax:28,sun:7,seed:1,days:90,care:{riego:3,abono:15,sustrato:365}},
 {id:'pimiento',n:'Pimiento',g:'alimentario',tMin:18,tMax:28,sun:7,seed:1,days:100,care:{riego:3,abono:15,sustrato:365}},
 {id:'calabacin',n:'Calabacín',g:'alimentario',tMin:16,tMax:28,sun:6,seed:1,days:60,care:{riego:3,abono:20,sustrato:365}},
 {id:'pepino',n:'Pepino',g:'alimentario',tMin:17,tMax:29,sun:7,seed:1,days:65,care:{riego:2,abono:20,sustrato:365}},
 {id:'judia',n:'Judía verde',g:'alimentario',tMin:15,tMax:27,sun:6,seed:0,days:70,care:{riego:3,abono:30,sustrato:365}},
 {id:'lechuga',n:'Lechuga',g:'alimentario',tMin:8,tMax:22,sun:4,seed:1,days:60,care:{riego:2,abono:30,sustrato:365}},
 {id:'espinaca',n:'Espinaca',g:'alimentario',tMin:6,tMax:19,sun:3,seed:0,days:45,care:{riego:3,abono:30,sustrato:365}},
 {id:'zanahoria',n:'Zanahoria',g:'alimentario',tMin:9,tMax:24,sun:5,seed:0,days:90,care:{riego:4,abono:45,sustrato:365}},
 {id:'rabano',n:'Rábano',g:'alimentario',tMin:7,tMax:24,sun:3,seed:0,days:30,care:{riego:2,abono:0,sustrato:365}},
 {id:'cebolla',n:'Cebolla',g:'alimentario',tMin:8,tMax:21,sun:5,seed:1,days:150,care:{riego:5,abono:30,sustrato:365}},
 {id:'ajo',n:'Ajo',g:'alimentario',tMin:5,tMax:16,sun:4,seed:0,days:210,care:{riego:7,abono:45,sustrato:365}},
 {id:'haba',n:'Haba',g:'alimentario',tMin:6,tMax:16,sun:4,seed:0,days:140,care:{riego:6,abono:0,sustrato:365}},
 {id:'garbanzo',n:'Garbanzo',g:'alimentario',tMin:9,tMax:20,sun:6,seed:0,days:130,care:{riego:10,abono:0,sustrato:365}},
 {id:'guisante',n:'Guisante',g:'alimentario',tMin:7,tMax:18,sun:4,seed:0,days:90,care:{riego:4,abono:0,sustrato:365}},
 {id:'melon',n:'Melón',g:'alimentario',tMin:18,tMax:30,sun:8,seed:1,days:100,care:{riego:3,abono:20,sustrato:365}},
 {id:'berenjena',n:'Berenjena',g:'alimentario',tMin:18,tMax:29,sun:7,seed:1,days:110,care:{riego:3,abono:15,sustrato:365}},
 {id:'sandia',n:'Sandía',g:'alimentario',tMin:19,tMax:30,sun:8,seed:1,days:100,care:{riego:3,abono:20,sustrato:365}},
 {id:'maiz',n:'Maíz dulce',g:'alimentario',tMin:16,tMax:30,sun:7,seed:0,days:90,care:{riego:3,abono:20,sustrato:365}},
 {id:'acelga',n:'Acelga',g:'alimentario',tMin:8,tMax:24,sun:4,seed:1,days:60,care:{riego:3,abono:30,sustrato:365}},
 {id:'col',n:'Col o repollo',g:'alimentario',tMin:8,tMax:20,sun:5,seed:1,days:120,care:{riego:3,abono:20,sustrato:365}},
 {id:'brocoli',n:'Brócoli',g:'alimentario',tMin:9,tMax:20,sun:5,seed:1,days:90,care:{riego:3,abono:20,sustrato:365}},
 {id:'coliflor',n:'Coliflor',g:'alimentario',tMin:9,tMax:19,sun:5,seed:1,days:110,care:{riego:3,abono:20,sustrato:365}},
 {id:'puerro',n:'Puerro',g:'alimentario',tMin:8,tMax:22,sun:4,seed:1,days:150,care:{riego:4,abono:30,sustrato:365}},
 {id:'patata',n:'Patata',g:'alimentario',tMin:9,tMax:20,sun:5,seed:0,days:110,care:{riego:4,abono:30,sustrato:365}},
 {id:'boniato',n:'Boniato',g:'alimentario',tMin:18,tMax:30,sun:7,seed:1,days:130,care:{riego:4,abono:30,sustrato:365}},
 {id:'remolacha',n:'Remolacha',g:'alimentario',tMin:8,tMax:22,sun:4,seed:0,days:75,care:{riego:3,abono:30,sustrato:365}},
 {id:'calabaza',n:'Calabaza',g:'alimentario',tMin:17,tMax:29,sun:7,seed:1,days:120,care:{riego:4,abono:20,sustrato:365}},
 {id:'fresa',n:'Fresa',g:'alimentario',tMin:10,tMax:20,sun:6,seed:0,days:120,care:{riego:2,abono:20,sustrato:365}},
 {id:'rucula',n:'Rúcula',g:'alimentario',tMin:8,tMax:22,sun:3,seed:0,days:35,care:{riego:2,abono:0,sustrato:365}},
 {id:'alcachofa',n:'Alcachofa',g:'alimentario',tMin:22,tMax:29,sun:6,seed:0,days:150,care:{riego:5,abono:30,sustrato:365}},
 {id:'esparrago',n:'Espárrago',g:'alimentario',tMin:9,tMax:18,sun:6,seed:0,days:730,care:{riego:6,abono:60,sustrato:365}},
 {id:'tagarnina',n:'Tagarnina',g:'alimentario',tMin:10,tMax:22,sun:6,seed:0,days:150,care:{riego:10,abono:0,sustrato:365}},
 {id:'albahaca',n:'Albahaca',g:'aromatica',tMin:18,tMax:30,sun:6,seed:1,days:60,care:{riego:2,abono:30,sustrato:365}},
 {id:'perejil',n:'Perejil',g:'aromatica',tMin:10,tMax:24,sun:4,seed:1,days:75,care:{riego:3,abono:30,sustrato:365}},
 {id:'cilantro',n:'Cilantro',g:'aromatica',tMin:10,tMax:22,sun:4,seed:0,days:50,care:{riego:3,abono:30,sustrato:365}},
 {id:'romero',n:'Romero',g:'aromatica',tMin:10,tMax:24,sun:7,seed:0,days:365,care:{riego:12,abono:0,sustrato:730}},
 {id:'tomillo',n:'Tomillo',g:'aromatica',tMin:10,tMax:24,sun:7,seed:1,days:120,care:{riego:12,abono:0,sustrato:730}},
 {id:'menta',n:'Menta',g:'aromatica',tMin:10,tMax:25,sun:4,seed:0,days:75,care:{riego:2,abono:30,sustrato:365}},
 {id:'oregano',n:'Orégano',g:'aromatica',tMin:12,tMax:25,sun:6,seed:1,days:90,care:{riego:10,abono:0,sustrato:730}},
 {id:'lavanda',n:'Lavanda',g:'aromatica',tMin:10,tMax:24,sun:7,seed:0,days:365,care:{riego:14,abono:0,sustrato:730}},
 {id:'salvia',n:'Salvia',g:'aromatica',tMin:10,tMax:24,sun:6,seed:1,days:120,care:{riego:10,abono:0,sustrato:730}},
 {id:'cebollino',n:'Cebollino',g:'aromatica',tMin:8,tMax:22,sun:4,seed:1,days:75,care:{riego:3,abono:30,sustrato:730}},
 {id:'eneldo',n:'Eneldo',g:'aromatica',tMin:10,tMax:24,sun:5,seed:0,days:60,care:{riego:4,abono:0,sustrato:365}},
 {id:'manzanilla',n:'Manzanilla',g:'aromatica',tMin:8,tMax:22,sun:5,seed:0,days:70,care:{riego:5,abono:0,sustrato:365}},
 {id:'alfalfa',n:'Alfalfa',g:'forrajero',tMin:10,tMax:25,sun:6,seed:0,days:80,care:{riego:6,abono:0,sustrato:0}},
 {id:'veza',n:'Veza',g:'forrajero',tMin:7,tMax:18,sun:4,seed:0,days:150,care:{riego:10,abono:0,sustrato:0}},
 {id:'trebol',n:'Trébol',g:'forrajero',tMin:8,tMax:22,sun:4,seed:0,days:90,care:{riego:6,abono:0,sustrato:0}},
 {id:'avena',n:'Avena forrajera',g:'forrajero',tMin:6,tMax:18,sun:4,seed:0,days:120,care:{riego:10,abono:0,sustrato:0}},
 {id:'cebada',n:'Cebada forrajera',g:'forrajero',tMin:6,tMax:18,sun:4,seed:0,days:110,care:{riego:10,abono:0,sustrato:0}},
 {id:'raigras',n:'Raigrás',g:'forrajero',tMin:8,tMax:22,sun:4,seed:0,days:60,care:{riego:6,abono:0,sustrato:0}},
 {id:'esparceta',n:'Esparceta',g:'forrajero',tMin:8,tMax:22,sun:6,seed:0,days:120,care:{riego:12,abono:0,sustrato:0}},
 {id:'sorgo',n:'Sorgo forrajero',g:'forrajero',tMin:18,tMax:30,sun:7,seed:0,days:70,care:{riego:7,abono:0,sustrato:0}},
 {id:'nabo',n:'Nabo forrajero',g:'forrajero',tMin:7,tMax:20,sun:4,seed:0,days:70,care:{riego:6,abono:0,sustrato:0}},
 {id:'girasol',n:'Girasol',g:'ornamental',tMin:15,tMax:28,sun:8,seed:0,days:80,care:{riego:4,abono:30,sustrato:365}},
 {id:'calendula',n:'Caléndula',g:'ornamental',tMin:8,tMax:22,sun:5,seed:1,days:60,care:{riego:4,abono:30,sustrato:365}},
 {id:'cosmos',n:'Cosmos',g:'ornamental',tMin:15,tMax:27,sun:7,seed:1,days:80,care:{riego:5,abono:30,sustrato:365}},
 {id:'pensamiento',n:'Pensamiento',g:'ornamental',tMin:6,tMax:18,sun:3,seed:1,days:90,care:{riego:3,abono:20,sustrato:365}},
 {id:'zinnia',n:'Zinnia',g:'ornamental',tMin:17,tMax:29,sun:7,seed:1,days:70,care:{riego:4,abono:30,sustrato:365}},
 {id:'capuchina',n:'Capuchina',g:'ornamental',tMin:12,tMax:25,sun:5,seed:0,days:60,care:{riego:4,abono:0,sustrato:365}},
 {id:'tagete',n:'Tagete',g:'ornamental',tMin:16,tMax:28,sun:7,seed:1,days:70,care:{riego:4,abono:30,sustrato:365}},
 {id:'petunia',n:'Petunia',g:'ornamental',tMin:15,tMax:27,sun:6,seed:1,days:90,care:{riego:2,abono:15,sustrato:365}},
 {id:'alheli',n:'Alhelí',g:'ornamental',tMin:8,tMax:20,sun:5,seed:1,days:100,care:{riego:4,abono:30,sustrato:365}},
 {id:'antirrino',n:'Boca de dragón',g:'ornamental',tMin:9,tMax:22,sun:6,seed:1,days:100,care:{riego:4,abono:30,sustrato:365}},
 {id:'algodon',n:'Algodón',g:'ornamental',tMin:19,tMax:30,sun:8,seed:0,days:150,care:{riego:5,abono:30,sustrato:365}},
 {id:'rosal',n:'Rosal',g:'ornamental',tMin:6,tMax:16,sun:6,seed:0,days:90,pm:'Final del invierno',care:{riego:4,abono:30,sustrato:0,poda:365}},
 {id:'jazmin',n:'Jazmín',g:'ornamental',tMin:12,tMax:22,sun:6,seed:0,days:120,pm:'Tras la floración',care:{riego:4,abono:30,sustrato:0,poda:365}},
 {id:'buganvilla',n:'Buganvilla',g:'ornamental',tMin:15,tMax:26,sun:7,seed:0,days:120,pm:'Final del invierno',care:{riego:6,abono:30,sustrato:0,poda:365}},
 {id:'hibisco',n:'Hibisco',g:'ornamental',tMin:15,tMax:26,sun:6,seed:0,days:90,pm:'Final del invierno',care:{riego:3,abono:20,sustrato:0,poda:365}},
 // Frutales (árboles y arbustos): tMin/tMax marcan la época de plantación (reposo invernal o primavera templada); yrs: años hasta la primera cosecha
 // chill: el mes más frío de la zona no debe pasar de esta media (necesitan frío invernal); frost: el mes más frío debe llegar al menos a esta media (no aguantan heladas)
 {id:'manzano',dec:1,lc:'Anna, Dorsett Golden o Ein Shemer',n:'Manzano',g:'frutal',tree:1,tMin:4,tMax:13,sun:6,seed:0,yrs:3,chill:10,pm:'Final del invierno',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'peral',dec:1,lc:'Flordahome, Hood o perales asiáticos (nashi)',n:'Peral',g:'frutal',tree:1,tMin:4,tMax:13,sun:6,seed:0,yrs:4,chill:10.5,pm:'Final del invierno',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'cerezo',dec:1,lc:'Minnie Royal y Royal Lee, plantadas juntas',n:'Cerezo',g:'frutal',tree:1,tMin:4,tMax:13,sun:7,seed:0,yrs:4,chill:9.5,pm:'Tras la cosecha, en verano',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'melocotonero',dec:1,lc:'Flordastar, UFO o Tropic Snow',n:'Melocotonero',g:'frutal',tree:1,tMin:5,tMax:14,sun:7,seed:0,yrs:3,chill:12,pm:'Final del invierno',care:{riego:6,abono:60,sustrato:0,poda:365}},
 {id:'nectarino',dec:1,lc:'Sunraycer, Panamint o Snow Queen',n:'Nectarino',g:'frutal',tree:1,tMin:5,tMax:14,sun:7,seed:0,yrs:3,chill:12,pm:'Final del invierno',care:{riego:6,abono:60,sustrato:0,poda:365}},
 {id:'ciruelo',dec:1,lc:'las japonesas Santa Rosa, Gulf Ruby o Methley',n:'Ciruelo',g:'frutal',tree:1,tMin:5,tMax:14,sun:6,seed:0,yrs:3,chill:12,pm:'Final del invierno',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'almendro',dec:1,lc:'Marcona o Desmayo Largueta',n:'Almendro',g:'frutal',tree:1,tMin:5,tMax:14,sun:7,seed:0,yrs:3,chill:12.5,pm:'Tras la cosecha, en otoño',care:{riego:12,abono:120,sustrato:0,poda:365}},
 {id:'higuera',dec:1,n:'Higuera',g:'frutal',tree:1,tMin:5,tMax:19,sun:7,seed:0,yrs:2,pm:'Final del invierno',care:{riego:10,abono:120,sustrato:0,poda:365}},
 {id:'granado',dec:1,n:'Granado',g:'frutal',tree:1,tMin:5,tMax:19,sun:7,seed:0,yrs:3,pm:'Final del invierno',care:{riego:10,abono:120,sustrato:0,poda:365}},
 {id:'olivo',n:'Olivo',g:'frutal',tree:1,tMin:9,tMax:20,sun:7,seed:0,yrs:4,frost:5,pm:'Tras la cosecha, a final de invierno',care:{riego:14,abono:120,sustrato:0,poda:365}},
 {id:'limonero',n:'Limonero',g:'frutal',tree:1,tMin:13,tMax:22,sun:7,seed:0,yrs:3,frost:9,pm:'Primavera, tras las heladas',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'naranjo',n:'Naranjo',g:'frutal',tree:1,tMin:13,tMax:22,sun:7,seed:0,yrs:3,frost:10,pm:'Primavera, tras la cosecha',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'nispero',n:'Níspero',g:'frutal',tree:1,tMin:12,tMax:21,sun:6,seed:0,yrs:3,frost:7,pm:'Tras la cosecha, a inicios de verano',care:{riego:7,abono:60,sustrato:0,poda:365}},
 {id:'kaki',dec:1,lc:'Rojo Brillante',n:'Caqui',g:'frutal',tree:1,tMin:5,tMax:14,sun:7,seed:0,yrs:3,chill:13,pm:'Final del invierno',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'nogal',dec:1,lc:'Chandler o Serr, aunque producirá poco',n:'Nogal',g:'frutal',tree:1,tMin:4,tMax:13,sun:7,seed:0,yrs:6,chill:9,pm:'Final del verano, solo lo justo',care:{riego:10,abono:120,sustrato:0,poda:730}},
 {id:'mango',n:'Mango',g:'frutal',tree:1,tMin:18,tMax:26,sun:8,seed:0,yrs:4,frost:11,pm:'Tras la cosecha',care:{riego:6,abono:60,sustrato:0,poda:365}},
 {id:'aguacate',n:'Aguacate',g:'frutal',tree:1,tMin:15,tMax:24,sun:6,seed:0,yrs:4,frost:11,pm:'Tras la cosecha, poda ligera',care:{riego:4,abono:60,sustrato:0,poda:365}},
 {id:'platanera',n:'Platanera',g:'frutal',tree:1,tMin:16,tMax:27,sun:7,seed:0,yrs:2,frost:11,pm:'Tras la cosecha, corta el tallo que dio la piña',care:{riego:3,abono:30,sustrato:0,poda:365}},
 {id:'albaricoquero',dec:1,lc:'Canino o Palabras',n:'Albaricoquero',g:'frutal',tree:1,tMin:5,tMax:14,sun:7,seed:0,yrs:3,chill:11,pm:'Tras la cosecha, en verano',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'membrillero',dec:1,n:'Membrillero',g:'frutal',tree:1,tMin:5,tMax:14,sun:6,seed:0,yrs:3,chill:13,pm:'Final del invierno',care:{riego:7,abono:90,sustrato:0,poda:365}},
 {id:'mandarino',n:'Mandarino',g:'frutal',tree:1,tMin:13,tMax:22,sun:7,seed:0,yrs:3,frost:9,pm:'Primavera, tras la cosecha',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'parra',dec:1,lc:'variedades de mesa como Moscatel o Italia',n:'Parra',g:'frutal',tree:1,tMin:5,tMax:15,sun:7,seed:0,yrs:2,chill:14,pm:'Pleno invierno',care:{riego:12,abono:120,sustrato:0,poda:365}},
 {id:'chirimoyo',n:'Chirimoyo',g:'frutal',tree:1,tMin:15,tMax:24,sun:6,seed:0,yrs:4,frost:11,pm:'Final del invierno, poda ligera',care:{riego:5,abono:60,sustrato:0,poda:365}},
 {id:'kiwi',dec:1,lc:'Hayward con un macho Tomuri',n:'Kiwi',g:'frutal',tree:1,tMin:5,tMax:14,sun:6,seed:0,yrs:4,chill:10,pm:'Pleno invierno',care:{riego:4,abono:60,sustrato:0,poda:365}},
 {id:'frambueso',dec:1,lc:'remontantes como Heritage o Polka',n:'Frambueso',g:'frutal',tree:1,tMin:4,tMax:14,sun:5,seed:0,yrs:1,chill:11,pm:'Final del invierno',care:{riego:3,abono:60,sustrato:0,poda:365}},
 {id:'arandano',dec:1,lc:'tipo «southern highbush» como Biloxi, Misty u O\'Neal',n:'Arándano',g:'frutal',tree:1,tMin:4,tMax:14,sun:5,seed:0,yrs:2,chill:10,pm:'Final del invierno',care:{riego:3,abono:60,sustrato:0,poda:365}},
 {id:'pitaya',n:'Pitaya',g:'frutal',tree:1,tMin:16,tMax:27,sun:6,seed:0,yrs:2,frost:11,pm:'Tras la cosecha, en otoño',care:{riego:10,abono:45,sustrato:0,poda:365}},
 {id:'pina',n:'Piña',g:'frutal',tree:1,tMin:18,tMax:28,sun:6,seed:0,yrs:2,frost:12,pm:'No necesita poda',care:{riego:7,abono:30,sustrato:0,poda:0}},
 {id:'azofaifo',dec:1,n:'Azofaifo',g:'frutal',tree:1,tMin:5,tMax:15,sun:7,seed:0,yrs:3,pm:'Final del invierno',care:{riego:14,abono:120,sustrato:0,poda:365}},
 // Plantas de maceta sin calendario de siembra
 {id:'geranio',n:'Geranio',g:'ornamental',pot:1,care:{riego:3,abono:15,sustrato:730}},
 {id:'potos',n:'Potos',g:'ornamental',pot:1,care:{riego:7,abono:30,sustrato:730}},
 {id:'monstera',n:'Monstera',g:'ornamental',pot:1,care:{riego:8,abono:30,sustrato:730}},
 {id:'sansevieria',n:'Sansevieria (lengua de suegra)',g:'ornamental',pot:1,care:{riego:18,abono:60,sustrato:1095}},
 {id:'dracaena',n:'Dracaena (tronco de Brasil)',g:'ornamental',pot:1,care:{riego:10,abono:30,sustrato:730}},
 {id:'cinta',n:'Cinta',g:'ornamental',pot:1,care:{riego:5,abono:30,sustrato:730}},
 {id:'orquidea',n:'Orquídea',g:'ornamental',pot:1,care:{riego:8,abono:15,sustrato:730}},
 {id:'calathea',n:'Calathea',g:'ornamental',pot:1,care:{riego:5,abono:30,sustrato:730}},
 {id:'zamioculca',n:'Zamioculca',g:'ornamental',pot:1,care:{riego:15,abono:60,sustrato:1095}},
 {id:'cactus',n:'Cactus y crasas',g:'ornamental',pot:1,care:{riego:15,abono:60,sustrato:1095}},
 {id:'plectranto',n:'Planta del dinero',g:'ornamental',pot:1,care:{riego:5,abono:30,sustrato:730}},
 {id:'gollum',n:'Oreja de Shrek',g:'ornamental',pot:1,care:{riego:15,abono:60,sustrato:1095}},
 {id:'jade',n:'Árbol de jade',g:'ornamental',pot:1,care:{riego:14,abono:60,sustrato:1095}},
 {id:'pilea',n:'Pilea (planta china del dinero)',g:'ornamental',pot:1,care:{riego:6,abono:30,sustrato:730}},
 {id:'aloe',n:'Aloe vera',g:'aromatica',pot:1,care:{riego:14,abono:60,sustrato:730}},
 {id:'apio',n:'Apio',g:'alimentario',tMin:12,tMax:24,sun:5,seed:1,days:120,care:{riego:2,abono:20,sustrato:365}},
 {id:'escarola',n:'Escarola',g:'alimentario',tMin:8,tMax:20,sun:4,seed:1,days:90,care:{riego:3,abono:30,sustrato:365}},
 {id:'canonigos',n:'Canónigos',g:'alimentario',tMin:6,tMax:18,sun:4,seed:0,days:60,care:{riego:3,abono:0,sustrato:365}},
 {id:'kale',n:'Kale (col rizada)',g:'alimentario',tMin:7,tMax:20,sun:5,seed:1,days:75,care:{riego:3,abono:30,sustrato:365}},
 {id:'colbruselas',n:'Coles de Bruselas',g:'alimentario',tMin:8,tMax:20,sun:5,seed:1,days:150,care:{riego:4,abono:30,sustrato:365}},
 {id:'lombarda',n:'Lombarda',g:'alimentario',tMin:8,tMax:20,sun:5,seed:1,days:120,care:{riego:3,abono:30,sustrato:365}},
 {id:'nabomesa',n:'Nabo',g:'alimentario',tMin:7,tMax:20,sun:4,seed:0,days:60,care:{riego:3,abono:0,sustrato:365}},
 {id:'chirivia',n:'Chirivía',g:'alimentario',tMin:8,tMax:20,sun:5,seed:0,days:130,care:{riego:4,abono:0,sustrato:365}},
 {id:'hinojo',n:'Hinojo',g:'alimentario',tMin:10,tMax:22,sun:6,seed:1,days:90,care:{riego:3,abono:30,sustrato:365}},
 {id:'lenteja',n:'Lenteja',g:'alimentario',tMin:6,tMax:18,sun:6,seed:0,days:120,care:{riego:8,abono:0,sustrato:365}},
 {id:'cacahuete',n:'Cacahuete',g:'alimentario',tMin:18,tMax:30,sun:8,seed:0,days:130,care:{riego:4,abono:0,sustrato:365}},
 {id:'okra',n:'Okra (quimbombó)',g:'alimentario',tMin:20,tMax:32,sun:8,seed:1,days:70,care:{riego:3,abono:20,sustrato:365}},
 {id:'chalota',n:'Chalota',g:'alimentario',tMin:6,tMax:16,sun:5,seed:0,days:150,care:{riego:7,abono:0,sustrato:365}},
 {id:'pakchoi',n:'Pak choi',g:'alimentario',tMin:10,tMax:22,sun:4,seed:1,days:50,care:{riego:2,abono:20,sustrato:365}},
 {id:'lima',n:'Lima',g:'frutal',tree:1,tMin:14,tMax:24,sun:7,seed:0,yrs:3,frost:11,pm:'Primavera, tras la cosecha',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'pomelo',n:'Pomelo',g:'frutal',tree:1,tMin:14,tMax:24,sun:7,seed:0,yrs:4,frost:10,pm:'Primavera, tras la cosecha',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'kumquat',n:'Kumquat',g:'frutal',tree:1,tMin:12,tMax:24,sun:7,seed:0,yrs:2,frost:8,pm:'Primavera, tras la cosecha',care:{riego:5,abono:45,sustrato:0,poda:365}},
 {id:'chumbera',n:'Chumbera (higo chumbo)',g:'frutal',tree:1,tMin:15,tMax:30,sun:8,seed:0,yrs:2,frost:6,pm:'Final del invierno',care:{riego:20,abono:180,sustrato:0,poda:730}},
 {id:'avellano',dec:1,lc:'Negreta o Pauetet',n:'Avellano',g:'frutal',tree:1,tMin:5,tMax:14,sun:5,seed:0,yrs:4,chill:9,pm:'Final del invierno',care:{riego:6,abono:90,sustrato:0,poda:365}},
 {id:'pistachero',dec:1,lc:'Kerman con macho Peters',n:'Pistachero',g:'frutal',tree:1,tMin:6,tMax:16,sun:8,seed:0,yrs:5,chill:11,pm:'Final del invierno',care:{riego:14,abono:120,sustrato:0,poda:365}},
 {id:'maracuya',n:'Maracuyá (fruta de la pasión)',g:'frutal',tree:1,tMin:16,tMax:28,sun:7,seed:0,yrs:1,frost:10,pm:'Final del invierno',care:{riego:4,abono:30,sustrato:0,poda:365}},
 {id:'guayabo',n:'Guayabo',g:'frutal',tree:1,tMin:16,tMax:28,sun:7,seed:0,yrs:3,frost:11,pm:'Tras la cosecha',care:{riego:6,abono:60,sustrato:0,poda:365}},
 {id:'hierbabuena',n:'Hierbabuena',g:'aromatica',tMin:10,tMax:25,sun:4,seed:0,days:75,care:{riego:2,abono:30,sustrato:365}},
 {id:'melisa',n:'Melisa (toronjil)',g:'aromatica',tMin:10,tMax:24,sun:4,seed:1,days:90,care:{riego:3,abono:45,sustrato:365}},
 {id:'estragon',n:'Estragón',g:'aromatica',tMin:10,tMax:24,sun:6,seed:0,days:90,care:{riego:5,abono:60,sustrato:730}},
 {id:'laurel',n:'Laurel',g:'aromatica',tMin:10,tMax:24,sun:6,seed:0,days:365,care:{riego:8,abono:90,sustrato:730}},
 {id:'hierbaluisa',n:'Hierbaluisa',g:'aromatica',tMin:14,tMax:26,sun:7,seed:0,days:120,care:{riego:4,abono:45,sustrato:730}},
 {id:'stevia',n:'Stevia',g:'aromatica',tMin:16,tMax:28,sun:7,seed:1,days:100,care:{riego:3,abono:30,sustrato:365}},
 {id:'citronela',n:'Citronela',g:'aromatica',tMin:16,tMax:28,sun:7,seed:0,days:120,care:{riego:3,abono:30,sustrato:365}},
 {id:'poleo',n:'Poleo',g:'aromatica',tMin:10,tMax:25,sun:5,seed:0,days:75,care:{riego:3,abono:45,sustrato:365}},
 {id:'altramuz',n:'Altramuz',g:'forrajero',tMin:7,tMax:18,sun:6,seed:0,days:150,care:{riego:10,abono:0,sustrato:0}},
 {id:'zulla',n:'Zulla',g:'forrajero',tMin:8,tMax:20,sun:6,seed:0,days:150,care:{riego:12,abono:0,sustrato:0}},
 {id:'centeno',n:'Centeno forrajero',g:'forrajero',tMin:4,tMax:16,sun:4,seed:0,days:150,care:{riego:12,abono:0,sustrato:0}},
 {id:'clavel',n:'Clavel',g:'ornamental',tMin:12,tMax:24,sun:6,seed:1,days:120,care:{riego:4,abono:20,sustrato:365}},
 {id:'margarita',n:'Margarita',g:'ornamental',tMin:10,tMax:22,sun:6,seed:1,days:100,care:{riego:4,abono:30,sustrato:365}},
 {id:'cesped',n:'Césped',g:'ornamental',tMin:13,tMax:20,sun:5,seed:0,days:60,care:{riego:3,abono:90,sustrato:0}},
 {id:'dalia',n:'Dalia',g:'ornamental',tMin:14,tMax:26,sun:6,seed:0,days:100,care:{riego:3,abono:20,sustrato:365}},
 {id:'gitanilla',n:'Gitanilla',g:'ornamental',pot:1,care:{riego:3,abono:15,sustrato:730}},
 {id:'begonia',n:'Begonia',g:'ornamental',pot:1,care:{riego:4,abono:20,sustrato:730}},
 {id:'kalanchoe',n:'Kalanchoe',g:'ornamental',pot:1,care:{riego:10,abono:45,sustrato:730}},
 {id:'ficus',n:'Ficus lyrata',g:'ornamental',pot:1,care:{riego:7,abono:30,sustrato:730}},
 {id:'espatifilo',n:'Espatifilo',g:'ornamental',pot:1,care:{riego:5,abono:30,sustrato:730}},
 {id:'lantana',n:'Lantana',g:'ornamental',tMin:15,tMax:28,sun:7,seed:0,days:90,pm:'Final del invierno',care:{riego:5,abono:45,sustrato:0,poda:365}}
];
// Los cultivos siempre en orden alfabético (desplegables, calendario, Consejos)
SPECIES.sort((a,b)=>a.n.localeCompare(b.n,'es'));
const SP=Object.fromEntries(SPECIES.map(s=>[s.id,s]));
// Consejos de siembra y cuidado por especie (orientativos)
const TIPS={
 tomate:{s:'Semillero a 0,5 cm de profundidad; trasplanta con 15–20 cm de altura, a 50 cm entre plantas y 1 m entre líneas.',r:'Riego regular y al pie, sin mojar las hojas. Los cambios bruscos de humedad agrietan el fruto.',l:'Pleno sol, al menos 7 horas.',t:'Suelo profundo y rico en materia orgánica, bien drenado.',a:'Compost al plantar y abono rico en potasio cuando aparezcan las flores.',p:'Mildiu, oídio, mosca blanca y tuta. Revisa el envés de las hojas.',c:'Recoge cuando el fruto tenga todo su color y ceda un poco al apretarlo.',b:'Albahaca, zanahoria, cebolla, caléndula.',e:'Patata, pepino e hinojo.',k:'Entutóralo y quita los chupones (brotes entre tallo y hoja) para que dé fruto más grande.'},
 pimiento:{s:'Semillero a 0,5 cm; germina lento, con calor (más de 20 °C). Trasplanta a 40–50 cm.',r:'Humedad constante; no tolera encharcamientos.',l:'Pleno sol.',t:'Suelo suelto, fértil y con buen drenaje.',a:'Compost de fondo y aporte de potasio en floración.',p:'Pulgón, araña roja y podredumbre apical (falta de calcio o riego irregular).',c:'Verde cuando alcance su tamaño o espera a que cambie de color para que esté más dulce.',b:'Albahaca, cebolla, zanahoria.',e:'Judía y hinojo.',k:'Acolcha el suelo con paja para mantener la humedad en verano.'},
 calabacin:{s:'Siembra directa de 2–3 semillas a 2 cm, en golpes separados 1 m.',r:'Abundante y al pie; nunca sobre las hojas.',l:'Sol, mínimo 6 horas.',t:'Muy exigente en materia orgánica.',a:'Mucho compost o estiércol maduro al plantar.',p:'Oídio (polvo blanco en hojas) y pulgón.',c:'Recoge con 15–20 cm; si los dejas crecer, la planta produce menos.',b:'Maíz, judía, capuchina.',e:'Patata.',k:'Si los frutos se pudren por la punta, poliniza a mano pasando la flor macho por la hembra.'},
 pepino:{s:'Siembra directa o semillero a 2 cm; separa 40–50 cm.',r:'Frecuente: el fruto es casi todo agua. Si le falta riego, amarga.',l:'Pleno sol con algo de resguardo del viento.',t:'Suelo esponjoso y rico.',a:'Compost al plantar y abono líquido cada 2–3 semanas.',p:'Oídio, mildiu, araña roja.',c:'Antes de que amarillee, con piel brillante.',b:'Lechuga, judía, eneldo.',e:'Tomate y patata.',k:'Guíalo en vertical con una malla: ahorra espacio y los frutos salen más rectos.'},
 judia:{s:'Siembra directa a 3 cm, en golpes de 3–4 semillas cada 40 cm. No necesita semillero.',r:'Moderado; más en floración y formación de vainas.',l:'Sol.',t:'Suelo suelto; no hace falta que sea muy rico.',a:'Poco: fija su propio nitrógeno.',p:'Pulgón negro y araña roja.',c:'Vainas tiernas, antes de que se marquen los granos.',b:'Maíz, calabaza, zanahoria, pepino.',e:'Cebolla, ajo y puerro.',k:'Las variedades de enrame necesitan cañas de unos 2 m.'},
 lechuga:{s:'Semillero o directa casi en superficie (necesita luz para germinar). Trasplanta a 25–30 cm.',r:'Frecuente y ligero; la falta de agua la vuelve amarga.',l:'Semisombra en verano, sol en invierno.',t:'Suelo fresco y mullido.',a:'Compost suave; el exceso de nitrógeno atrae pulgón.',p:'Babosas, caracoles y pulgón.',c:'Hoja a hoja desde fuera o la planta entera antes de que espigue.',b:'Zanahoria, rábano, fresa, cebolla.',e:'Perejil en exceso.',k:'Siembra un poco cada 2–3 semanas para tener lechuga continuamente.'},
 espinaca:{s:'Siembra directa a 1–2 cm, en líneas separadas 25 cm.',r:'Mantén el suelo húmedo.',l:'Sol suave o semisombra.',t:'Fértil y fresco.',a:'Compost antes de sembrar.',p:'Pulgón, mildiu y minadores.',c:'Hojas exteriores cuando tengan buen tamaño.',b:'Fresa, rábano, guisante.',e:'Acelga muy cerca.',k:'Con calor y días largos se espiga: siémbrala en otoño o a finales de invierno.'},
 zanahoria:{s:'Siembra directa a 1 cm, muy repartida; aclara a 5 cm. No admite trasplante.',r:'Regular. Si se alterna sequía y riego fuerte, la raíz se raja.',l:'Sol.',t:'Arenoso, suelto y sin piedras, o la raíz se deforma.',a:'Sin estiércol fresco: provoca raíces bifurcadas.',p:'Mosca de la zanahoria.',c:'A los 3 meses aprox., cuando el cuello asome con buen grosor.',b:'Cebolla, puerro, lechuga, tomate.',e:'Eneldo.',k:'Mezcla la semilla con arena para repartirla mejor.'},
 rabano:{s:'Siembra directa a 1 cm, separados 3–5 cm.',r:'Frecuente: si le falta agua se vuelve picante y hueco.',l:'Sol o semisombra.',t:'Suelto y húmedo.',a:'No necesita.',p:'Pulguilla (agujeritos en las hojas).',c:'Rapidísimo: entre 3 y 5 semanas.',b:'Lechuga, zanahoria, espinaca.',e:'Col.',k:'Siémbralo entre cultivos lentos: lo cosechas antes de que estorbe.'},
 cebolla:{s:'Semillero a 1 cm; trasplanta cuando la planta tenga el grosor de un lápiz, a 10–15 cm.',r:'Moderado; deja de regar cuando las hojas se doblen.',l:'Sol.',t:'Suelto y sin encharcar.',a:'Poco nitrógeno; compost bien hecho.',p:'Mildiu y mosca de la cebolla.',c:'Cuando las hojas se secan y caen. Déjala secar unos días al sol.',b:'Zanahoria, lechuga, tomate.',e:'Judía y guisante.',k:'No la entierres demasiado al trasplantar: el bulbo debe quedar casi en superficie.'},
 ajo:{s:'Planta dientes con la punta hacia arriba a 3–4 cm de profundidad, separados 10–15 cm.',r:'Escaso: le basta la lluvia de invierno. Corta el riego un mes antes de cosechar.',l:'Sol.',t:'Suelto y bien drenado.',a:'No quiere estiércol fresco.',p:'Roya y podredumbre si hay exceso de humedad.',c:'A inicios de verano, cuando la mitad de las hojas estén secas.',b:'Tomate, fresa, zanahoria.',e:'Judía, guisante y haba.',k:'Usa dientes grandes de cabezas sanas, mejor de semilla certificada.'},
 haba:{s:'Siembra directa a 4–5 cm, 2–3 semillas cada 25 cm.',r:'Poco; aguanta bien con la lluvia.',l:'Sol.',t:'Arcilloso o normal; tolera suelos pobres.',a:'No necesita: fija nitrógeno.',p:'Pulgón negro en las puntas.',c:'Vainas llenas pero tiernas, o grano seco si quieres guardarlo.',b:'Lechuga, patata, espinaca.',e:'Ajo y cebolla.',k:'Despunta la planta cuando florezca bien: frena el pulgón y engorda las vainas.'},
 guisante:{s:'Siembra directa a 3 cm, en líneas o golpes cada 10 cm.',r:'Moderado; más en floración.',l:'Sol.',t:'Suelto y fresco.',a:'No necesita.',p:'Oídio y pájaros al nacer.',c:'Vaina llena y verde brillante, antes de que se endurezca.',b:'Zanahoria, rábano, lechuga.',e:'Ajo y cebolla.',k:'Ponle una malla o ramas para que trepe.'},
 melon:{s:'Semillero o directa a 2–3 cm, con mucho calor. Separa 1 m.',r:'Abundante al crecer y menos al madurar, para que endulce.',l:'Pleno sol, muchas horas.',t:'Rico, suelto y cálido.',a:'Mucho compost; potasio al formar fruto.',p:'Oídio y pulgón.',c:'Cuando huele dulce y el pedúnculo se agrieta o se suelta.',b:'Maíz, girasol.',e:'Patata y pepino muy cerca.',k:'Pon una teja o tabla bajo cada melón para que no se pudra con la humedad del suelo.'},
 albahaca:{s:'Semillero casi en superficie con calor; trasplanta a 25 cm.',r:'Frecuente, sin encharcar y sin mojar las hojas.',l:'Sol o mucha luz; en interior, junto a una ventana luminosa.',t:'Suelto y fértil.',a:'Abono suave cada mes.',p:'Pulgón y babosas.',c:'Pinza las puntas a menudo.',b:'Tomate y pimiento.',e:'Ruda.',k:'Quita las flores en cuanto salgan: así sigue dando hojas aromáticas.'},
 perejil:{s:'Siembra a 1 cm; tarda en germinar (hasta 3–4 semanas). Remoja la semilla un día antes.',r:'Mantén húmedo.',l:'Sol suave o semisombra.',t:'Fértil y fresco.',a:'Compost suave.',p:'Pocos; a veces pulgón.',c:'Corta los tallos exteriores desde la base.',b:'Tomate, espárrago.',e:'Lechuga muy junta.',k:'Es bianual: el segundo año florece y deja de dar hojas buenas.'},
 cilantro:{s:'Siembra directa a 1 cm (no le gusta el trasplante).',r:'Regular.',l:'Sol suave; con calor fuerte se espiga.',t:'Normal y bien drenado.',a:'Poco.',p:'Pocos.',c:'Hojas jóvenes antes de la floración; luego las semillas secas.',b:'Espinaca, anís.',e:'Hinojo.',k:'Siémbralo cada 3 semanas, porque espiga pronto.'},
 alfalfa:{s:'Siembra a voleo a 1 cm sobre tierra bien preparada; pasa un rastrillo y apisona.',r:'Poco una vez enraizada; tiene raíces muy profundas.',l:'Sol.',t:'Suelo no ácido y bien drenado.',a:'No necesita nitrógeno; algo de fósforo y potasio.',p:'Pulgón y gorgojo de la alfalfa.',c:'Corta al inicio de la floración, varias veces al año.',b:'Gramíneas como la avena.',e:'Sembrarla donde acabas de tener alfalfa.',k:'Mejora el suelo: deja nitrógeno para el siguiente cultivo.'},
 veza:{s:'Siembra a voleo o en líneas a 3–4 cm, en otoño.',r:'Le basta la lluvia.',l:'Sol.',t:'Tolera suelos pobres.',a:'No necesita.',p:'Pulgón.',c:'Siega en floración para forraje o como abono verde.',b:'Avena o cebada como tutor.',e:'—',k:'Mézclala con avena: la avena la sujeta y el forraje sale más completo.'},
 trebol:{s:'Siembra a voleo muy superficial (0,5 cm).',r:'Regular en verano.',l:'Sol o semisombra.',t:'Fresco.',a:'No necesita.',p:'Pocos.',c:'Siega cuando florezca; rebrota.',b:'Césped y gramíneas.',e:'—',k:'Atrae a los polinizadores y cubre el suelo.'},
 avena:{s:'Siembra a voleo o en líneas a 3 cm, en otoño.',r:'Le basta la lluvia en la mayoría de zonas.',l:'Sol.',t:'Poco exigente.',a:'Algo de nitrógeno al sembrar.',p:'Roya.',c:'Siega en verde para forraje o en grano maduro.',b:'Veza y guisante forrajero.',e:'—',k:'Sirve como abono verde si la entierras antes de que grane.'},
 girasol:{s:'Siembra directa a 2–3 cm, separados 40–60 cm.',r:'Moderado, profundo y espaciado.',l:'Pleno sol: lo sigue durante el día.',t:'Profundo y suelto.',a:'Compost al sembrar.',p:'Pájaros en las semillas y babosas al nacer.',c:'Pipas cuando el dorso de la flor amarillea.',b:'Pepino, maíz, calabaza.',e:'Patata.',k:'Ponle tutor si hace viento; las variedades gigantes pesan mucho.'},
 calendula:{s:'Directa o semillero a 1 cm.',r:'Moderado.',l:'Sol.',t:'Cualquier suelo bien drenado.',a:'Poco.',p:'Pulgón y oídio.',c:'Flores abiertas para infusiones o pomadas.',b:'Tomate y casi todas las hortalizas.',e:'—',k:'Quita las flores secas para que florezca más tiempo. Atrae insectos beneficiosos al huerto.'},
 cosmos:{s:'Directa o semillero a 0,5 cm.',r:'Moderado; aguanta la sequía.',l:'Pleno sol.',t:'Pobre o normal: en suelo muy rico da más hojas y menos flor.',a:'Casi nada.',p:'Pocos.',c:'Florece de verano a otoño.',b:'Hortalizas: atrae polinizadores.',e:'—',k:'Corta las flores pasadas para alargar la floración.'},
 pensamiento:{s:'Semillero a 0,5 cm, en oscuridad y con fresco.',r:'Regular, sin encharcar.',l:'Sol de invierno o semisombra.',t:'Fértil.',a:'Abono para flor cada 2–3 semanas.',p:'Babosas y pulgón.',c:'Florece de otoño a primavera.',b:'Bulbos de primavera.',e:'—',k:'Ideal para dar color en invierno en balcones.'},
 geranio:{s:'Se multiplica mejor por esqueje en primavera o finales de verano.',r:'Cuando la tierra esté seca en superficie; menos en invierno.',l:'Mucho sol.',t:'Sustrato universal con buen drenaje.',a:'Abono para flor cada 15 días en primavera y verano.',p:'Taladro del geranio (mariposa) y pulgón.',c:'Florece de primavera a otoño.',b:'—',e:'—',k:'Quita las flores secas y pódalo a finales de invierno.'},
 potos:{s:'Esqueje en agua: enraíza en 2–3 semanas.',r:'Cuando los primeros centímetros de tierra estén secos.',l:'Luz indirecta; tolera rincones poco luminosos.',t:'Sustrato universal aireado.',a:'Abono verde cada mes en primavera y verano.',p:'Cochinilla y araña roja con ambiente seco.',c:'Planta de hoja, todo el año.',b:'—',e:'—',k:'Si las hojas pierden el jaspeado, necesita más luz.'},
 manzano:{s:'Planta a raíz desnuda en pleno reposo (sin hojas), con el injerto 5–10 cm por encima del suelo. Hoyo de 60×60 cm.',r:'Riega a fondo al plantar y cada semana los dos primeros veranos; luego, solo en sequía.',l:'Pleno sol, al menos 6 horas.',t:'Profundo, fresco y bien drenado.',a:'Estiércol maduro o compost a finales de invierno, alrededor de la copa.',p:'Pulgón, carpocapsa (gusano de la manzana) y moteado.',c:'Cuando la manzana se suelta al girarla con suavidad.',b:'Capuchina, ajo, consuelda al pie.',e:'Nogal cerca.',o:'Poda de formación en vaso o eje los primeros años. Después, a final de invierno, quita ramas secas, cruzadas y chupones verticales.',k:'La mayoría necesita otro manzano cerca para polinizar; si solo tienes sitio para uno, búscalo autofértil.'},
 peral:{s:'Raíz desnuda en invierno, sin enterrar el injerto. Separa 4–5 m de otros árboles.',r:'Regular los primeros años; no le gusta la sequía en verano.',l:'Pleno sol.',t:'Fresco y profundo; tolera algo de arcilla.',a:'Compost a finales de invierno.',p:'Psila, moteado y fuego bacteriano.',c:'Cógelas aún firmes y deja que maduren en casa unos días.',b:'Capuchina, ajo.',e:'Enebro cerca (transmite roya).',o:'Poda suave a final de invierno: aclara el centro y respeta las ramitas cortas con yemas gordas, que son las que dan fruto.',k:'Igual que el manzano, suele necesitar otra variedad cerca para dar fruto.'},
 cerezo:{s:'Raíz desnuda en invierno, en un sitio donde no se encharque nunca.',r:'Moderado; el exceso de agua le pudre las raíces.',l:'Pleno sol.',t:'Suelto, profundo y muy bien drenado.',a:'Poco: compost cada invierno.',p:'Mosca de la cereza, pulgón negro y pájaros.',c:'Cuando tengan todo el color, con su rabito.',b:'Ajo, capuchina.',e:'Patata y tomate cerca.',o:'Mejor poco y tras la cosecha, en verano: en invierno las heridas cicatrizan mal y sale goma.',k:'Pon una malla antes de que maduren o se las comerán los pájaros.'},
 nectarino:{s:'Raíz desnuda en invierno o en maceta hasta inicios de primavera.',r:'Regular y sin encharcar, más en verano mientras engorda el fruto.',l:'Pleno sol y resguardado del viento.',t:'Suelto, fértil y bien drenado.',a:'Compost en invierno y algo de potasio en primavera.',p:'Lepra, pulgón y mosca de la fruta; su piel lisa se marca más con el granizo.',c:'Cuando el color de fondo pasa de verde a amarillo y cede un poco al apretarlo.',b:'Ajo, capuchina.',e:'Hierba alta bajo la copa.',o:'Es un melocotonero de piel lisa: poda fuerte cada año a final de invierno, renovando un tercio de la madera.',k:'Aclara los frutitos dejando uno cada 15 cm y protégelo de la lluvia en floración.'},
 melocotonero:{s:'Raíz desnuda en invierno o en maceta hasta inicios de primavera.',r:'Regular, sobre todo mientras engorda el fruto.',l:'Pleno sol y resguardado del viento.',t:'Suelto y bien drenado.',a:'Compost en invierno y algo de potasio en primavera.',p:'Lepra (hojas abolladas y rojizas) y pulgón.',c:'Cuando cede un poco al apretarlo y huele dulce.',b:'Ajo, capuchina.',e:'Hierba alta bajo la copa.',o:'Poda fuerte cada año a final de invierno: fructifica en las ramas del año anterior, así que renueva un tercio de la madera.',k:'Aclara los frutitos dejando uno cada 15 cm: saldrán más grandes y dulces.'},
 ciruelo:{s:'Raíz desnuda en invierno.',r:'Moderado; más en la formación del fruto.',l:'Sol.',t:'Se adapta a casi todos los suelos.',a:'Compost en invierno.',p:'Pulgón y gomosis.',c:'Cuando el fruto se suelta solo y tiene su pruina (polvillo blanco).',b:'Ajo, capuchina.',e:'—',o:'Ligera: quita ramas secas, cruzadas y chupones a final de invierno.',k:'Es de los frutales más agradecidos para empezar.'},
 almendro:{s:'Raíz desnuda en invierno, en el sitio más soleado.',r:'Muy poco una vez establecido; aguanta bien la sequía.',l:'Pleno sol.',t:'Pobre y seco le va bien; odia el encharcamiento.',a:'Poco.',p:'Pulgón y heladas en la floración.',c:'Cuando la cáscara verde se abre sola, a finales de verano.',b:'Romero, lavanda.',e:'Riegos frecuentes.',o:'En otoño tras la cosecha: abre el centro para que entre la luz y quita ramas secas.',k:'Florece muy pronto: en zonas con heladas tardías, elige una variedad de floración tardía.'},
 higuera:{s:'En cepellón o esqueje enraizado, a finales de invierno.',r:'Poco; riega en verano si es joven.',l:'Pleno sol y calor.',t:'Cualquiera bien drenado, incluso pobre o pedregoso.',a:'Casi no necesita.',p:'Mosca del higo y pájaros.',c:'Cuando el higo cuelga, está blando y se agrieta la piel.',b:'Ruda, caléndula.',e:'Muros o tuberías cerca: sus raíces llegan lejos.',o:'A final de invierno, solo para dar forma y quitar ramas bajas o secas. Si la podas mucho, da menos higos.',k:'Si hace mucho frío, protege el tronco joven con paja durante el invierno.'},
 granado:{s:'En cepellón o raíz desnuda a finales de invierno.',r:'Poco una vez establecido; más regular en verano para que el fruto no se raje.',l:'Pleno sol.',t:'Muy tolerante, incluso calizo.',a:'Compost en primavera.',p:'Pulgón y rajado del fruto.',c:'En otoño, cuando la piel suena hueca al golpearla.',b:'Romero, salvia.',e:'—',o:'A final de invierno: quita chupones de la base y aclara el interior, dejando 3–4 ramas principales.',k:'Quita los chupones de la base para que crezca como árbol y no como arbusto.'},
 olivo:{s:'En cepellón, en otoño o primavera, con tutor.',r:'Escaso; los dos primeros veranos cada 2 semanas.',l:'Pleno sol.',t:'Bien drenado; tolera suelos pobres y calizos.',a:'Poco: compost cada invierno.',p:'Mosca del olivo, repilo y tuberculosis.',c:'En verde a finales de verano para aliñar; negras en otoño-invierno para aceite.',b:'Lavanda, romero, tomillo.',e:'Riego abundante.',o:'Tras la cosecha, a final de invierno: abre la copa para que entre el sol, dejando un vaso con 3–4 ramas principales.',k:'Las heladas fuertes y prolongadas lo dañan; en zonas frías, mejor en un rincón resguardado.'},
 limonero:{s:'En cepellón a inicios de primavera, cuando ya no hiela.',r:'Regular y sin encharcar; menos en invierno.',l:'Pleno sol.',t:'Suelto, algo ácido y muy drenado.',a:'Abono para cítricos de primavera a otoño.',p:'Cochinilla, pulgón y minador de los cítricos.',c:'Casi todo el año, según la variedad.',b:'Caléndula, capuchina.',e:'—',o:'Muy ligera en primavera: quita chupones vigorosos del interior y ramas secas o cruzadas.',k:'Si amarillean las hojas con nervios verdes, le falta hierro: usa abono con quelatos.'},
 naranjo:{s:'En cepellón en primavera, con el injerto por encima del suelo.',r:'Regular; nunca encharcar.',l:'Pleno sol y resguardado del viento frío.',t:'Suelto, ligeramente ácido y drenado.',a:'Abono para cítricos de primavera a otoño.',p:'Cochinilla, pulgón y mosca de la fruta.',c:'En invierno, cuando la naranja tiene buen color y sabor.',b:'Caléndula, capuchina.',e:'—',o:'Ligera tras la cosecha, en primavera: limpia el interior y las ramas bajas que tocan el suelo.',k:'En maceta grande lo puedes resguardar del frío en invierno.'},
 nispero:{o:'Tras la cosecha, a inicios de verano: aclara la copa para que el fruto coja sol.',s:'En cepellón en primavera u otoño templado.',r:'Regular, sobre todo en primavera mientras engorda el fruto.',l:'Sol; tolera algo de sombra.',t:'Cualquiera bien drenado.',a:'Compost en otoño, antes de la floración.',p:'Moteado y mosca de la fruta.',c:'En primavera, cuando el fruto está naranja y algo blando.',b:'Caléndula.',e:'—',k:'Florece en otoño-invierno: una helada fuerte en esa época se lleva la cosecha.'},
 kaki:{o:'A final de invierno: aclara la copa y acorta ramas largas; da fruto en los brotes del año.',s:'Raíz desnuda en invierno, con el injerto por encima del suelo.',r:'Regular en verano; si le falta agua, tira los frutos.',l:'Pleno sol.',t:'Profundo y fresco.',a:'Compost en invierno.',p:'Pocos; mosca de la fruta y cochinilla.',c:'En otoño, con buen color; las variedades astringentes maduran después en casa.',b:'—',e:'—',k:'Sus hojas se ponen rojas y naranjas en otoño: también es muy ornamental.'},
 nogal:{o:'Casi no necesita. Si hace falta, a final de verano, porque en invierno y primavera sangra mucha savia.',s:'Raíz desnuda en invierno, con mucho espacio: llega a 15–20 m.',r:'Regular los primeros años.',l:'Pleno sol.',t:'Profundo, fresco y fértil.',a:'Compost cada invierno.',p:'Bacteriosis y carpocapsa.',c:'En otoño, cuando la cáscara verde se abre y la nuez cae.',b:'—',e:'Huertos y frutales cerca: sus raíces frenan a otras plantas.',k:'Plántalo lejos de casas y del huerto; es un árbol para muchos años.'},
 mango:{o:'Tras la cosecha: despunta las ramas para que salgan más brotes y mantenerlo a una altura cómoda.',s:'En cepellón a finales de primavera, en el rincón más cálido y resguardado.',r:'Regular de joven; menos antes de florecer para que dé más flor.',l:'Pleno sol.',t:'Suelto, profundo y muy drenado.',a:'Abono equilibrado en primavera y verano.',p:'Oídio en la flor y antracnosis.',c:'En verano-otoño, cuando cede al tacto y huele dulce.',b:'—',e:'Heladas y viento frío.',k:'Solo prospera en costas sin heladas, como la Axarquía o Canarias.'},
 aguacate:{s:'En cepellón en primavera; plántalo sin romper el cepellón, sus raíces son muy delicadas.',r:'Frecuente y ligero; no soporta el encharcamiento.',l:'Sol con algo de resguardo de joven.',t:'Muy suelto y aireado, nada arcilloso.',a:'Abono rico en nitrógeno en primavera y verano.',p:'Podredumbre de raíz por exceso de agua.',c:'Se cosecha duro y madura fuera del árbol en unos días.',b:'—',e:'Suelos pesados.',o:'Mínima tras la cosecha: solo para controlar la altura y quitar ramas secas.',k:'Para tener fruto fiable, mejor dos variedades que se polinicen (por ejemplo, Hass y Bacon).'},
 platanera:{s:'Planta un hijuelo con raíz (de 1 m más o menos) a finales de primavera, con la tierra ya caliente.',r:'Abundante y frecuente en verano: tiene hojas enormes y pierde mucha agua. Menos en invierno, sin encharcar.',l:'Pleno sol, resguardada del viento, que rompe las hojas.',t:'Profundo, rico en materia orgánica y muy drenado.',a:'Mucho abono: estiércol o compost en primavera y abono rico en potasio en verano.',p:'Picudo de la platanera, cochinilla y trips.',c:'Unos 12–15 meses después de plantarla. Corta la piña entera cuando los plátanos estén llenos y aún verdes; maduran colgados en casa.',b:'—',e:'Heladas, viento y frío por debajo de 10 °C.',o:'Cada tallo da fruto una sola vez: tras cosechar, córtalo a ras de suelo. Deja crecer solo uno o dos hijuelos para el año siguiente.',k:'Solo prospera en costas sin heladas, como Canarias, la costa de Málaga o Granada. En maceta muy grande puede vivir en un patio soleado.'},
 monstera:{s:'Esqueje con raíz aérea y al menos un nudo.',r:'Cuando la mitad superior del sustrato esté seca.',l:'Luz indirecta brillante.',t:'Sustrato aireado con corteza y perlita.',a:'Abono verde cada mes en primavera y verano.',p:'Cochinilla y araña roja.',c:'Las hojas nuevas salen más abiertas con buena luz.',b:'—',e:'—',k:'Ponle un tutor de musgo para que trepe y haga hojas grandes.'},
 dracaena:{s:'Esqueje de punta o trozos de tronco de 10–15 cm, enterrados un tercio en sustrato húmedo.',r:'Cuando los primeros 3–4 cm de tierra estén secos: cada 7–10 días en verano y cada 2–3 semanas en invierno. Sin agua en el plato.',l:'Mucha luz indirecta; el sol directo quema las hojas y con poca luz pierde el color.',t:'Sustrato universal con perlita, bien drenado.',a:'Abono verde cada mes de primavera a verano; nada en invierno.',p:'Cochinilla y araña roja con ambiente seco; podredumbre del tronco por exceso de riego.',c:'Planta de hoja, todo el año. Limpia el polvo de las hojas con un paño húmedo.',b:'—',e:'—',k:'Las puntas marrones suelen ser por aire seco o agua con mucha cal: pulveriza las hojas y riega con agua reposada o de lluvia.'},
 sansevieria:{s:'Hijuelos o esquejes de hoja.',r:'Muy poco: cada 2–3 semanas, y casi nada en invierno.',l:'De sombra a sol suave.',t:'Sustrato de cactus o muy drenante.',a:'Muy poco.',p:'Podredumbre por exceso de riego.',c:'Planta de hoja, casi indestructible.',b:'—',e:'—',k:'Ante la duda, no la riegues.'},
 aloe:{s:'Hijuelos que salen de la base.',r:'Escaso; deja secar del todo entre riegos.',l:'Mucho sol o luz intensa.',t:'Sustrato de cactus.',a:'Muy poco.',p:'Podredumbre y cochinilla.',c:'Corta las hojas exteriores para usar su gel.',b:'—',e:'—',k:'Si las hojas se ponen rojizas o marrones, le está dando demasiado sol directo.'},
 berenjena:{s:'Semillero a 0,5 cm con mucho calor (más de 20 °C); trasplanta a 50–60 cm cuando tenga 4–5 hojas.',r:'Regular y al pie; no soporta que la tierra se seque del todo.',l:'Pleno sol, cuanto más calor mejor.',t:'Profundo, fértil y bien drenado.',a:'Compost al plantar y abono con potasio cuando florezca.',p:'Escarabajo de la patata, araña roja y pulgón.',c:'Con la piel brillante y tersa; si está mate, ya está pasada y amarga.',b:'Judía, pimiento, tomillo.',e:'Patata e hinojo.',k:'Deja 4–5 frutos por planta a la vez y saldrán más grandes.'},
 sandia:{s:'Semillero o directa a 2–3 cm con la tierra ya caliente; separa 1,5–2 m.',r:'Abundante al crecer; reduce cuando los frutos engorden para que endulcen.',l:'Pleno sol, muchas horas.',t:'Arenoso, suelto y cálido.',a:'Mucho compost al plantar; potasio al formar fruto.',p:'Oídio, pulgón y araña roja.',c:'Cuando el zarcillo junto al fruto se seca y la mancha de apoyo pasa de blanca a amarilla.',b:'Maíz, girasol, rábano.',e:'Patata.',k:'Ocupa mucho: guía los tallos hacia fuera del bancal para que no tapen otros cultivos.'},
 maiz:{s:'Siembra directa a 3–4 cm, 2 semillas cada 30 cm, en bloque de varias filas cortas.',r:'Abundante, sobre todo cuando salen las barbas.',l:'Pleno sol.',t:'Fértil y profundo.',a:'Exigente en nitrógeno: compost de fondo y un aporte cuando alcance la rodilla.',p:'Taladro del maíz, pájaros al nacer.',c:'Cuando las barbas están secas y al apretar un grano sale un jugo lechoso.',b:'Judía y calabaza (las «tres hermanas»).',e:'Tomate.',k:'Plántalo en bloque, no en una sola fila: se poliniza con el viento y así las mazorcas salen llenas.'},
 acelga:{s:'Directa o semillero a 2 cm; cada «semilla» da varias plantas: aclara a 30 cm.',r:'Regular, que la tierra no se seque.',l:'Sol o semisombra.',t:'Fértil y fresco.',a:'Compost al sembrar.',p:'Pulgón, minador y babosas.',c:'Corta las hojas exteriores; la planta sigue produciendo meses.',b:'Lechuga, cebolla, judía.',e:'Espinaca muy cerca.',k:'Es de las hortalizas más agradecidas: una sola siembra da hojas durante casi todo el año.'},
 col:{s:'Semillero a 1 cm; trasplanta con 4–5 hojas a 50 cm, enterrando el tallo hasta las primeras hojas.',r:'Regular y abundante.',l:'Sol.',t:'Fértil, fresco y algo arcilloso.',a:'Exigente: estiércol maduro o mucho compost.',p:'Oruga de la col (mariposa blanca), pulgón ceniciento y babosas.',c:'Cuando el cogollo está prieto y duro al apretarlo.',b:'Apio, eneldo, tomillo, lechuga.',e:'Fresa y tomate.',k:'Cúbrela con malla antiinsectos fina para que la mariposa no ponga huevos.'},
 brocoli:{s:'Semillero a 1 cm; trasplanta a 50 cm con 4–5 hojas.',r:'Regular; con sequía florece antes de tiempo.',l:'Sol.',t:'Fértil y fresco.',a:'Compost abundante al plantar.',p:'Oruga de la col y pulgón.',c:'Corta la cabeza central con los botones aún cerrados; después saldrán brotes laterales.',b:'Apio, cebolla, lechuga.',e:'Fresa y tomate.',k:'No esperes a que amarillee: si se abren las flores, pierde sabor.'},
 coliflor:{s:'Semillero a 1 cm; trasplanta a 60 cm.',r:'Constante: los cambios de humedad la dejan pequeña.',l:'Sol.',t:'Muy fértil y fresco.',a:'Exigente: estiércol maduro o compost abundante.',p:'Oruga de la col y pulgón.',c:'Cuando la pella es compacta y blanca, antes de que se separen los granos.',b:'Apio, cebolla, judía.',e:'Fresa y tomate.',k:'Cuando asome la pella, dobla unas hojas por encima para que no se ponga amarilla con el sol.'},
 puerro:{s:'Semillero a 1 cm; trasplanta con el grosor de un lápiz, en hoyos profundos de 15 cm.',r:'Regular.',l:'Sol.',t:'Profundo y fértil.',a:'Compost al trasplantar.',p:'Polilla y mosca del puerro, roya.',c:'Desde que tiene el grosor de un dedo; aguanta meses en la tierra.',b:'Zanahoria, apio, fresa.',e:'Judía y guisante.',k:'Arrima tierra al tallo según crece: así sale más largo y blanco.'},
 patata:{s:'Planta patatas de siembra certificadas (enteras o en trozos con 2–3 ojos) a 10 cm, separadas 30 cm.',r:'Moderado; más en la floración, que es cuando forma los tubérculos.',l:'Sol.',t:'Suelto, profundo y algo ácido.',a:'Compost bien hecho; nada de cal.',p:'Escarabajo de la patata, mildiu y gusano de alambre.',c:'Cuando la mata amarillea y se seca; las tempranas, en plena floración.',b:'Haba, judía, maíz.',e:'Tomate, calabaza y girasol.',k:'Aporca (arrima tierra) cuando las matas tengan 20 cm: las patatas no deben ver la luz o se ponen verdes.'},
 remolacha:{s:'Siembra directa a 2 cm; cada «semilla» da varias plantas: aclara a 10 cm.',r:'Regular; si se seca, la raíz queda leñosa.',l:'Sol o semisombra.',t:'Suelto, profundo y sin piedras.',a:'Compost suave; poco nitrógeno.',p:'Pulguilla y minadores.',c:'Cuando la raíz tenga el tamaño de una pelota de tenis.',b:'Lechuga, cebolla, col.',e:'Judía de enrame.',k:'Las hojas tiernas también se comen, como las de acelga.'},
 calabaza:{s:'Directa o semillero a 2–3 cm; 2–3 semillas por golpe, separados 1,5–2 m.',r:'Abundante al pie; nunca sobre las hojas.',l:'Pleno sol.',t:'Muy rico en materia orgánica.',a:'Mucho estiércol maduro o compost.',p:'Oídio y pulgón.',c:'Cuando el tallo se seca y la piel no se raya con la uña.',b:'Maíz y judía.',e:'Patata.',k:'Déjala curar al sol 1–2 semanas tras cosecharla y aguantará meses en casa.'},
 fresa:{s:'Planta las plantas o estolones con la corona (el centro) justo a ras de tierra, a 30 cm.',r:'Frecuente y ligero, sin mojar los frutos.',l:'Sol.',t:'Suelto, algo ácido y con mucha materia orgánica.',a:'Compost al plantar y abono con potasio en floración.',p:'Babosas, pájaros, oídio y botritis.',c:'Cuando toda la fresa está roja; recoge cada dos días.',b:'Ajo, cebolla, lechuga, espinaca.',e:'Col y brócoli.',k:'Acolcha con paja: los frutos no tocan la tierra y no se pudren.'},
 rucula:{s:'Siembra directa a 0,5 cm, en líneas o a voleo.',r:'Frecuente: con sequía pica mucho y se espiga.',l:'Sol suave o semisombra.',t:'Cualquiera fresco.',a:'No necesita.',p:'Pulguilla (agujeritos en las hojas).',c:'Corta las hojas con 10 cm; rebrota varias veces.',b:'Lechuga, zanahoria.',e:'Col muy cerca (comparten plagas).',k:'Siembra un poco cada 3 semanas; en verano, mejor a la sombra.'},
 alcachofa:{s:'Planta zuecas (trozos de raíz con yemas) en verano, a 1 m entre plantas.',r:'Abundante en verano y otoño; menos en invierno.',l:'Sol.',t:'Profundo y fértil.',a:'Mucho estiércol maduro al plantar y cada otoño.',p:'Pulgón y taladro.',c:'Antes de que las brácteas se abran, con la cabeza prieta.',b:'Haba, lechuga.',e:'Ninguna destacable.',k:'Dura 3–4 años en el mismo sitio; después renueva las plantas con zuecas nuevas.'},
 romero:{s:'Mejor por esqueje de 10 cm en primavera u otoño; por semilla es muy lento.',r:'Muy poco; deja secar bien entre riegos.',l:'Pleno sol.',t:'Pobre, seco y calizo; odia el encharcamiento.',a:'No necesita.',p:'Casi ninguna; podredumbre si se riega de más.',c:'Corta ramitas todo el año.',b:'Col, zanahoria, salvia.',e:'Menta y plantas que piden mucha agua.',k:'Recórtalo un poco tras la floración para que no se vuelva leñoso por abajo.'},
 tomillo:{s:'Semilla casi en superficie o esqueje en primavera.',r:'Escaso.',l:'Pleno sol.',t:'Pobre, pedregoso y muy drenado.',a:'No necesita.',p:'Casi ninguna.',c:'Corta las puntas antes y durante la floración.',b:'Col, berenjena, tomate.',e:'Plantas de riego abundante.',k:'Atrae abejas: plántalo cerca del huerto para mejorar la polinización.'},
 menta:{s:'Esqueje o trozo de raíz en primavera; enraíza incluso en un vaso de agua.',r:'Frecuente: le gusta la humedad.',l:'Semisombra o sol suave.',t:'Fresco y fértil.',a:'Compost suave en primavera.',p:'Roya y pulgón.',c:'Corta tallos enteros antes de la floración, cuando más aroma tiene.',b:'Col y tomate (aleja plagas).',e:'Perejil y manzanilla.',k:'Plántala en maceta aunque esté en el huerto: sus raíces lo invaden todo.'},
 oregano:{s:'Semilla casi en superficie o división de mata en primavera.',r:'Poco; aguanta la sequía.',l:'Sol.',t:'Pobre y bien drenado.',a:'No necesita: sin abono tiene más aroma.',p:'Casi ninguna.',c:'Corta los tallos en plena floración y sécalos boca abajo a la sombra.',b:'Pimiento, tomate, calabaza.',e:'Plantas de riego abundante.',k:'El orégano seco tiene más sabor que el fresco.'},
 lavanda:{s:'Esqueje semileñoso a final de verano o planta en maceta en otoño.',r:'Muy poco una vez establecida.',l:'Pleno sol.',t:'Pobre, calizo y muy drenado.',a:'No necesita.',p:'Podredumbre de raíz por exceso de agua.',c:'Corta las espigas cuando se abren las primeras flores.',b:'Rosales, frutales (atrae polinizadores).',e:'Plantas de riego abundante.',k:'Pódala tras la floración sin llegar a la madera vieja, que ya no rebrota.'},
 salvia:{s:'Semilla a 0,5 cm o esqueje en primavera.',r:'Poco.',l:'Sol.',t:'Suelto y bien drenado.',a:'No necesita.',p:'Oídio con humedad.',c:'Hojas antes de la floración.',b:'Romero, col, zanahoria.',e:'Pepino.',k:'Renuévala con esquejes cada 3–4 años: con la edad se vuelve leñosa.'},
 cebollino:{s:'Semilla a 0,5 cm o división de mata.',r:'Regular.',l:'Sol o semisombra.',t:'Fértil y fresco.',a:'Compost suave.',p:'Pocas; a veces roya.',c:'Corta las hojas a 3 cm del suelo: rebrota enseguida.',b:'Zanahoria, tomate, fresa.',e:'Judía y guisante.',k:'Sus flores moradas también se comen en ensalada.'},
 eneldo:{s:'Siembra directa a 1 cm; no le gusta el trasplante.',r:'Moderado.',l:'Sol.',t:'Suelto y bien drenado.',a:'No necesita.',p:'Pulgón.',c:'Hojas antes de que florezca; semillas cuando se ponen marrones.',b:'Col, lechuga, pepino.',e:'Zanahoria e hinojo.',k:'Atrae mariquitas, que se comen el pulgón del huerto.'},
 manzanilla:{s:'Siembra directa en superficie, sin tapar (necesita luz para germinar).',r:'Moderado.',l:'Sol.',t:'Cualquiera, incluso pobre.',a:'No necesita.',p:'Casi ninguna.',c:'Las flores recién abiertas; sécalas a la sombra.',b:'Col, cebolla.',e:'Menta.',k:'Se resiembra sola: deja algunas flores y volverá cada año.'},
 cebada:{s:'Siembra a voleo o en líneas a 3 cm, sobre tierra labrada.',r:'Le basta la lluvia de otoño e invierno.',l:'Sol.',t:'Se adapta a casi todos, incluso calizos.',a:'Algo de estiércol antes de sembrar.',p:'Roya y pulgón.',c:'En verde para forraje, o en grano cuando se seque la espiga.',b:'Veza (mezcla clásica para forraje).',e:'Sembrarla varios años seguidos en el mismo sitio.',k:'Es más rústica y rápida que la avena en suelos pobres.'},
 raigras:{s:'A voleo a 1 cm; pasa el rastrillo y apisona.',r:'Regular: no aguanta bien la sequía.',l:'Sol.',t:'Fértil y fresco.',a:'Nitrógeno tras cada corte.',p:'Roya.',c:'Corta a 5–7 cm del suelo; rebrota varias veces.',b:'Trébol.',e:'—',k:'Mezclado con trébol da un pasto más completo y que se abona solo.'},
 esparceta:{s:'Siembra en líneas a 2–3 cm, en otoño o a finales de invierno.',r:'Muy poco: aguanta sequía.',l:'Sol.',t:'Calizo y pobre le va bien.',a:'No necesita: fija nitrógeno.',p:'Pocas.',c:'Al inicio de la floración.',b:'Gramíneas.',e:'—',k:'No hincha al ganado como la alfalfa, y sus flores rosas atraen abejas.'},
 sorgo:{s:'Siembra directa a 3 cm con la tierra ya caliente.',r:'Aguanta bien el calor y la sequía.',l:'Pleno sol.',t:'Cualquiera bien drenado.',a:'Algo de nitrógeno al sembrar.',p:'Pulgón y pájaros.',c:'Corta con más de 80 cm de altura; rebrota.',b:'—',e:'—',k:'No lo des al ganado cuando está muy tierno o tras una helada: puede ser tóxico.'},
 nabo:{s:'A voleo a 1 cm a finales de verano u otoño.',r:'Moderado al nacer.',l:'Sol.',t:'Suelto y fresco.',a:'Compost suave.',p:'Pulguilla.',c:'Hojas y raíz cuando la raíz tenga el tamaño de un puño.',b:'Avena y veza.',e:'Col (comparten plagas).',k:'Sus raíces descompactan el suelo para el siguiente cultivo.'},
 zinnia:{s:'Directa o semillero a 0,5 cm con calor; separa 25–30 cm.',r:'Moderado, al pie y sin mojar las hojas.',l:'Pleno sol.',t:'Fértil y bien drenado.',a:'Abono para flor cada mes.',p:'Oídio si se mojan las hojas.',c:'Florece todo el verano.',b:'Tomate, pimiento (atrae polinizadores).',e:'—',k:'Corta flores para jarrón: cuantas más cortas, más flores saca.'},
 capuchina:{s:'Siembra directa a 2 cm; remoja la semilla un día antes.',r:'Moderado.',l:'Sol o semisombra.',t:'Pobre: con mucho abono da hojas y pocas flores.',a:'No necesita.',p:'Pulgón negro (lo atrae, y así lo aparta de otras plantas).',c:'Flores y hojas se comen, con sabor picante.',b:'Calabacín, col, tomate, frutales.',e:'—',k:'Ponla al pie de los frutales o junto a las coles como planta trampa del pulgón.'},
 tagete:{s:'Semillero o directa a 0,5 cm; separa 20–30 cm.',r:'Moderado.',l:'Pleno sol.',t:'Cualquiera bien drenado.',a:'Poco.',p:'Pocas; babosas al nacer.',c:'Florece de verano a otoño.',b:'Tomate, pimiento, patata (aleja nematodos y mosca blanca).',e:'—',k:'También llamado clavel de moro: intercálalo en el huerto como protector.'},
 petunia:{s:'Semillero en superficie con calor: la semilla es diminuta, no la tapes.',r:'Frecuente en verano, sobre todo en maceta.',l:'Sol.',t:'Sustrato universal fértil.',a:'Abono para flor cada 15 días.',p:'Pulgón, mosca blanca y oruga del geranio.',c:'Florece de primavera a otoño.',b:'—',e:'—',k:'Pinza las puntas al principio para que ramifique y quita las flores secas.'},
 alheli:{s:'Semillero a 0,5 cm a finales de verano; trasplanta a 25 cm.',r:'Moderado, sin encharcar.',l:'Sol.',t:'Suelto y algo calizo.',a:'Abono para flor en primavera.',p:'Pulgón y oruga de la col.',c:'Florece a finales de invierno y primavera, muy perfumado.',b:'—',e:'Col (comparten plagas).',k:'Plántalo cerca de una ventana o un camino para disfrutar el olor.'},
 antirrino:{s:'Semillero en superficie a finales de verano o en primavera; trasplanta a 25–30 cm.',r:'Moderado.',l:'Sol.',t:'Fértil y bien drenado.',a:'Abono para flor cada mes.',p:'Roya y pulgón.',c:'Florece en primavera y otoño.',b:'—',e:'—',k:'Corta las espigas pasadas y sacará otras nuevas.'},
 cinta:{s:'Planta los hijuelos que cuelgan de la madre; enraízan enseguida.',r:'Cuando la tierra esté seca en superficie.',l:'Luz indirecta; aguanta poca luz.',t:'Sustrato universal.',a:'Abono verde cada mes en primavera y verano.',p:'Puntas secas por aire seco o agua con mucha cal.',c:'Planta de hoja; a veces da florecillas blancas.',b:'—',e:'—',k:'Es de las plantas más fáciles: ideal para empezar.'},
 orquidea:{s:'Se compra en planta; también da hijuelos (keikis) en la vara.',r:'Por inmersión 10 minutos cuando las raíces estén plateadas; escurre bien.',l:'Mucha luz indirecta, sin sol directo.',t:'Corteza de pino en maceta transparente.',a:'Abono de orquídeas muy diluido cada 2 semanas.',p:'Cochinilla y podredumbre por exceso de agua.',c:'Florece 2–3 meses, una o dos veces al año.',b:'—',e:'—',k:'Cuando acabe la floración, corta la vara por encima del segundo nudo para que vuelva a florecer.'},
 calathea:{s:'División de mata al trasplantar.',r:'Frecuente, con agua sin cal; que la tierra no se seque del todo.',l:'Luz indirecta; el sol directo quema las hojas.',t:'Sustrato universal aireado.',a:'Abono verde suave cada mes en primavera y verano.',p:'Araña roja con aire seco; puntas marrones por agua con cal.',c:'Planta de hoja; de noche pliega las hojas hacia arriba.',b:'—',e:'—',k:'Agradece la humedad: ponla sobre un plato con piedras y agua.'},
 zamioculca:{s:'División de rizomas o esqueje de hoja (muy lento).',r:'Muy poco: cuando el sustrato esté seco del todo.',l:'Luz indirecta; aguanta rincones oscuros.',t:'Sustrato con buen drenaje.',a:'Muy poco.',p:'Podredumbre de rizoma por exceso de riego.',c:'Planta de hoja.',b:'—',e:'—',k:'Guarda agua en sus rizomas: es casi imposible que se muera de sed.'},
 cactus:{s:'Hijuelos o esquejes de hoja; deja secar el corte unos días antes de plantar.',r:'Escaso en primavera y verano; casi nada en invierno.',l:'Mucho sol o luz muy intensa.',t:'Sustrato de cactus.',a:'Abono de cactus 2–3 veces en verano.',p:'Cochinilla algodonosa y podredumbre.',c:'Muchos florecen en primavera si pasan un invierno fresco y seco.',b:'—',e:'—',k:'Si se estiran y pierden color, les falta luz.'},
 albaricoquero:{s:'Raíz desnuda en invierno, en un sitio soleado y resguardado de heladas tardías.',r:'Regular mientras engorda el fruto; poco después.',l:'Pleno sol.',t:'Suelto, profundo y bien drenado.',a:'Compost a final de invierno.',p:'Pulgón, monilia y gomosis.',c:'Cuando el fruto está naranja y cede un poco al tocarlo.',b:'Ajo, capuchina al pie.',e:'Nogal cerca.',o:'Tras la cosecha, en verano: así cicatriza mejor y evitas la gomosis. Aclara el centro de la copa.',k:'Florece muy pronto: evita los fondos de valle donde se acumulan las heladas.'},
 membrillero:{s:'Raíz desnuda en invierno.',r:'Regular en verano.',l:'Sol.',t:'Fresco y algo arcilloso; no le gustan los calizos.',a:'Estiércol maduro en invierno.',p:'Moteado y pulgón.',c:'En otoño, cuando la piel pierde la pelusilla y amarillea.',b:'—',e:'—',o:'Muy poca: a final de invierno, solo ramas secas, cruzadas y chupones.',k:'Es de los frutales más rústicos y fáciles: casi no da problemas.'},
 mandarino:{s:'En cepellón en primavera, con el injerto por encima del suelo.',r:'Regular y sin encharcar; menos en invierno.',l:'Pleno sol.',t:'Suelto, algo ácido y drenado.',a:'Abono para cítricos de primavera a otoño.',p:'Pulgón, cochinilla, minador y mosca de la fruta.',c:'Cuando tiene todo su color y está dulce; aguanta un tiempo en el árbol.',b:'Capuchina al pie.',e:'—',o:'Ligera tras la cosecha: aclara el interior y quita chupones.',k:'Aguanta algo más de frío que el naranjo, y en maceta grande va muy bien.'},
 parra:{s:'Barbado (planta enraizada) a raíz desnuda en invierno, junto a una pérgola o espaldera.',r:'Poco; aguanta bien la sequía.',l:'Pleno sol.',t:'Pobre, pedregoso y bien drenado.',a:'Poco: compost cada 2 años.',p:'Oídio, mildiu y avispas al madurar.',c:'Cuando las uvas están dulces y la raspa empieza a ponerse marrón.',b:'—',e:'—',o:'En pleno invierno: deja pocas yemas en cada sarmiento del año anterior.',k:'Una parra sobre una pérgola da sombra en verano y deja pasar el sol en invierno.'},
 chirimoyo:{s:'En cepellón en primavera, en un rincón cálido y resguardado del viento.',r:'Regular de primavera a otoño; poco en invierno.',l:'Sol con algo de resguardo.',t:'Suelto, fértil y muy drenado.',a:'Compost y abono equilibrado en primavera.',p:'Mosca de la fruta y cochinilla.',c:'Cuando la piel se aclara a verde amarillento; termina de madurar en casa.',b:'—',e:'—',o:'Ligera a final de invierno, para mantener la copa baja y aireada.',k:'Poliniza a mano con un pincel para tener más fruta.'},
 kiwi:{s:'En cepellón a final de invierno, junto a una pérgola fuerte.',r:'Abundante: es muy sediento en verano.',l:'Sol con resguardo del viento.',t:'Fértil, fresco y algo ácido.',a:'Compost abundante en invierno.',p:'Pocas; podredumbre si se encharca.',c:'En otoño, aún duros; maduran en casa en unas semanas.',b:'—',e:'—',o:'En invierno: acorta los brotes que ya dieron fruto. En verano, despunta los muy largos.',k:'Hay plantas macho y hembra: necesitas un macho por cada 6–8 hembras para tener fruta.'},
 boniato:{s:'Pon un boniato medio enterrado en arena húmeda o en un vaso de agua para que saque brotes; cuando midan 20 cm, sepáralos y plántalos a 30–40 cm, enterrando la mitad del tallo.',r:'Regular al principio para que enraíce; después moderado. Corta el riego unas semanas antes de cosechar.',l:'Pleno sol y calor.',t:'Arenoso, suelto y bien drenado, en caballones.',a:'Poco nitrógeno (da mucha hoja y poco tubérculo); algo de potasio.',p:'Gusano de alambre, roedores y gorgojo del boniato.',c:'A los 4 meses, cuando las hojas empiezan a amarillear y siempre antes del frío; desentierra con cuidado, la piel se daña con facilidad.',b:'Judía, tomillo.',e:'Calabaza (compiten por el sitio).',k:'Déjalos curar 1–2 semanas en un sitio cálido tras cosecharlos: se vuelven mucho más dulces y aguantan meses.'},
 garbanzo:{s:'Siembra directa a 4–5 cm, 2 semillas cada 15–20 cm, en líneas separadas 50 cm. Remoja la semilla 12 horas antes.',r:'Muy poco: le basta la lluvia de invierno y primavera; el exceso de agua lo pudre.',l:'Pleno sol.',t:'Suelto, profundo y bien drenado; tolera suelos pobres y calizos.',a:'No necesita: fija su propio nitrógeno.',p:'Rabia del garbanzo (manchas con humedad) y heliotis (oruga en la vaina).',c:'Para seco, cuando la planta amarillea y las vainas suenan al agitarlas; en verde, con la vaina llena y tierna.',b:'Trigo, cebada, girasol.',e:'Ajo y cebolla.',k:'En el sur se siembra a finales de invierno; la variedad «Blanco lechoso» es muy agradecida.'},
 frambueso:{s:'Planta a raíz desnuda en invierno, a 50 cm entre plantas, con un alambre o espaldera para guiar las cañas.',r:'Regular y frecuente en verano: tiene raíces superficiales.',l:'Sol; en el sur, mejor con sombra en las horas de más calor.',t:'Fresco, rico en materia orgánica y algo ácido.',a:'Compost o estiércol maduro a final de invierno.',p:'Pulgón, araña roja y podredumbre del fruto (botritis).',c:'Cuando el fruto se suelta solo al tirar suavemente; recoge cada 2–3 días.',b:'Ajo, caléndula.',e:'Patata y tomate.',o:'Final del invierno: corta a ras de suelo las cañas que ya dieron fruto. En las remontantes, puedes cortarlas todas.',k:'Las remontantes dan fruto en verano y otoño, y piden menos frío invernal.'},
 arandano:{s:'En cepellón en invierno, en un sitio con tierra ácida o en maceta grande con sustrato para plantas ácidas.',r:'Frecuente, mejor con agua de lluvia o sin cal; no tolera que se seque.',l:'Sol; en el sur, algo de sombra a mediodía.',t:'Muy ácido (pH 4,5–5,5), suelto y con mucha materia orgánica. En suelo calizo no prospera.',a:'Abono para acidófilas en primavera.',p:'Pájaros (protégelos con malla) y clorosis si el agua tiene cal.',c:'Cuando están azules del todo y se sueltan con facilidad.',b:'Otras plantas de suelo ácido, como fresas.',e:'Suelos calizos y riego con agua dura.',o:'Final del invierno: quita ramas viejas, débiles o cruzadas desde el cuarto año.',k:'Planta al menos dos variedades distintas: polinizan mejor y dan más fruta.'},
 pitaya:{s:'Esqueje de 30 cm dejado secar una semana, plantado en primavera junto a un poste o muro para trepar.',r:'Escaso, como un cactus; algo más en floración y fruto.',l:'Sol; en zonas muy cálidas, algo de sombra en verano.',t:'Suelto y muy drenado, con materia orgánica.',a:'Abono equilibrado en primavera y verano.',p:'Podredumbre por exceso de agua y cochinilla.',c:'Unos 30–50 días tras la floración, cuando la piel cambia de color por completo.',b:'—',e:'—',o:'Tras la cosecha: quita tallos que se cruzan o cuelgan hasta el suelo.',k:'Florece de noche: si no cuaja, poliniza a mano con un pincel al anochecer.'},
 azofaifo:{s:'Raíz desnuda o cepellón en invierno.',r:'Muy poco una vez establecido: aguanta sequía y calor extremo.',l:'Pleno sol.',t:'Cualquiera, incluso pobre, calizo o algo salino.',a:'Casi no necesita.',p:'Casi ninguna.',c:'En otoño, cuando la piel se mancha de marrón: crujiente como una manzana. Si se arrugan, saben a dátil.',b:'—',e:'—',o:'Final del invierno: aclara la copa y quita los hijuelos de la base.',k:'Es de los frutales más resistentes que hay: ideal para un rincón seco donde nada más prospera.'},
 algodon:{s:'Siembra directa a 3 cm con la tierra ya caliente, 2–3 semillas cada 40 cm. Remoja la semilla un día antes.',r:'Moderado; abundante en floración y menos al abrirse las cápsulas.',l:'Pleno sol y mucho calor.',t:'Profundo y bien drenado.',a:'Compost al sembrar.',p:'Pulgón, mosca blanca y oruga de la cápsula.',c:'Cuando las cápsulas se abren y asoma el algodón, a finales de verano u otoño.',b:'Tagete, girasol.',e:'—',k:'Muy decorativo: flores amarillas o rosadas y cápsulas blancas que duran meses en ramo seco.'},
 rosal:{s:'Planta a raíz desnuda de noviembre a febrero, o en maceta casi todo el año. Deja el injerto a ras de suelo.',r:'Profundo y al pie, sin mojar las hojas; más en verano.',l:'Al menos 6 horas de sol; mejor sol de mañana.',t:'Profundo, fértil y bien drenado; agradece arcilla con materia orgánica.',a:'Estiércol o compost en invierno y abono para rosales en primavera y tras cada floración.',p:'Pulgón, oídio, mancha negra y roya. Ventila bien la planta y riega al pie.',c:'Corta las flores pasadas para que vuelva a florecer.',b:'Lavanda, ajo, cebollino, tagete.',e:'—',o:'Poda fuerte a final del invierno dejando 3–5 tallos con 3–4 yemas hacia fuera; quita madera seca y chupones.',k:'Las rosas antiguas y de pie franco aguantan mejor la sequía y las plagas.'},
 jazmin:{s:'Planta en primavera u otoño; se multiplica fácil por esqueje semileñoso en verano o por acodo.',r:'Moderado; deja secar la superficie entre riegos.',l:'Sol o semisombra; con más sol florece más y huele más.',t:'Suelto, fértil y bien drenado.',a:'Abono para plantas de flor cada mes en primavera y verano.',p:'Pulgón, cochinilla y mosca blanca.',c:'Florece en primavera y verano; su olor es más intenso al atardecer.',b:'Rosal, lavanda.',e:'—',o:'Tras la floración, aclara tallos viejos y guía los nuevos; es trepadora y necesita soporte.',k:'El jazmín común aguanta heladas suaves; el jazmín de Arabia o sambac es más friolero y va mejor en maceta.'},
 buganvilla:{s:'Planta en primavera con el suelo ya templado; no rompas el cepellón al trasplantar, sus raíces son delicadas.',r:'Escaso una vez arraigada; el exceso de agua le quita flor.',l:'Pleno sol y calor: cuanto más sol, más color.',t:'Cualquiera bien drenado, incluso pobre.',a:'Poco nitrógeno; abono rico en potasio en primavera y verano.',p:'Pulgón, cochinilla y mosca blanca.',c:'Florece de primavera a otoño; el color está en las brácteas, no en la flor.',b:'Plumbago, lantana.',e:'—',o:'A final del invierno, recorta las ramas del año anterior y quita las que se cruzan; tiene espinas, usa guantes.',k:'Teme las heladas: por debajo de 0 °C pierde hojas y con frío fuerte puede morir. En zonas frías, en maceta y a cubierto en invierno.'},
 hibisco:{s:'Planta en primavera, cuando ya no haya frío; también por esqueje en verano.',r:'Frecuente en verano, sin encharcar; menos en invierno.',l:'Sol o mucha luz; a pleno sol en verano necesita más agua.',t:'Fértil, algo ácido y bien drenado.',a:'Abono para plantas de flor cada 2–3 semanas en primavera y verano.',p:'Pulgón, mosca blanca, araña roja y cochinilla.',c:'Cada flor dura un día, pero salen sin parar de primavera a otoño.',b:'Buganvilla, jazmín.',e:'—',o:'Poda a final del invierno para darle forma y que saque más ramas con flor.',k:'El hibisco de jardín (Hibiscus syriacus) aguanta el frío y pierde la hoja en invierno; el tropical (rosa de China) es más friolero.'},
 plectranto:{s:'Esqueje de tallo en primavera o verano: enraíza enseguida, incluso en un vaso de agua.',r:'Cuando la tierra esté seca en superficie; menos en invierno.',l:'Luz indirecta abundante; aguanta poca luz pero crece más lacia.',t:'Sustrato universal con buen drenaje.',a:'Abono verde cada mes en primavera y verano.',p:'Cochinilla y podredumbre por exceso de riego.',c:'Planta de hoja colgante; da espigas de florecillas blancas en otoño.',b:'—',e:'—',k:'Su nombre botánico es Plectranthus verticillatus. Pinza las puntas para que se vuelva más tupida.'},
 gollum:{s:'Esqueje de rama o de hoja; deja secar el corte unos días antes de plantar.',r:'Escaso: deja secar el sustrato del todo entre riegos; casi nada en invierno.',l:'Mucha luz, con algo de sol directo; con sol las puntas se ponen rojizas.',t:'Sustrato de cactus y crasas.',a:'Abono de cactus 2–3 veces en verano.',p:'Cochinilla algodonosa y podredumbre.',c:'Planta de hoja; de adulta puede dar flores blancas o rosadas en invierno.',b:'—',e:'—',k:'Es una variedad del árbol de jade (Crassula ovata «Gollum»), que también se considera planta del dinero.'},
 jade:{s:'Esqueje de rama o de hoja; deja secar el corte unos días antes de plantar.',r:'Escaso: deja secar el sustrato del todo entre riegos; casi nada en invierno.',l:'Mucha luz, con algo de sol directo; aguanta fuera en zonas sin heladas.',t:'Sustrato de cactus y crasas.',a:'Abono de cactus 2–3 veces en verano.',p:'Cochinilla algodonosa y podredumbre por exceso de agua.',c:'Planta de hoja; de adulta puede dar flores blancas o rosadas en invierno.',b:'—',e:'—',k:'Es la Crassula ovata, el «árbol del dinero» tradicional. Con los años forma un tronco grueso, como un pequeño bonsái.'},
 pilea:{s:'Hijuelos que salen junto a la planta madre o del tallo; sepáralos con un poco de raíz.',r:'Cuando los primeros centímetros de tierra estén secos.',l:'Luz indirecta brillante, sin sol fuerte directo.',t:'Sustrato universal aireado.',a:'Abono verde suave cada mes en primavera y verano.',p:'Pocas; hojas caídas por exceso de riego.',c:'Planta de hoja, con hojas redondas como monedas.',b:'—',e:'—',k:'Gira la maceta cada semana: crece hacia la luz y se tuerce. Sus hijuelos son perfectos para regalar.'},
 esparrago:{s:'Planta garras (raíces de un año) a finales de invierno, en una zanja de 20 cm, separadas 40 cm y con las yemas hacia arriba; cúbrelas poco a poco según brotan.',r:'Regular el primer año; después, moderado. Más en verano, cuando la planta forma reservas.',l:'Sol.',t:'Arenoso, suelto, profundo y sin encharcar.',a:'Estiércol maduro abundante al plantar y cada invierno.',p:'Mosca y criocero del espárrago, roya.',c:'A partir del tercer año, en primavera: corta los turiones de 15–20 cm a ras de suelo durante 6–8 semanas.',b:'Tomate, perejil, albahaca.',e:'Ajo, cebolla y patata.',k:'Dura 10–15 años en el mismo sitio: elige bien el rincón. Para espárrago blanco, aporca la tierra para que no vean la luz.'},
 tagarnina:{s:'Siembra directa a 1–2 cm en otoño, con las primeras lluvias; aclara a 20–30 cm.',r:'Le basta la lluvia de otoño e invierno; riega solo si hay sequía larga.',l:'Pleno sol.',t:'Cualquiera, incluso pobre o arcilloso; es una planta silvestre.',a:'No necesita.',p:'Casi ninguna.',c:'De finales de invierno a primavera, cuando la roseta es joven y tierna, antes de que espigue. Usa guantes: pincha.',b:'—',e:'—',k:'Para cocinarla se pela quitando las espinas y se aprovecha la penca central. Si dejas alguna florecer, se resiembra sola.'},
 pina:{s:'Corta la corona de hojas de una piña madura, quita las hojas de abajo, déjala secar 2–3 días y plántala en sustrato suelto, enterrando solo la base. Enraíza en unas semanas con calor.',r:'Moderado: echa agua en la tierra y un poco en el centro de la roseta; deja secar entre riegos.',l:'Mucha luz, con sol suave; en verano, protegida del sol más fuerte.',t:'Suelto, ácido y muy drenado (como para cactus con algo de turba).',a:'Abono líquido suave cada mes en primavera y verano.',p:'Cochinilla y podredumbre por exceso de agua o frío.',c:'Unos 2 años después de plantar sale una flor en el centro y, a los 5–6 meses, la piña. Está lista cuando amarillea desde la base y huele dulce.',b:'—',e:'—',o:'No necesita poda: quita solo las hojas secas y los hijuelos de la base, que puedes plantar aparte.',k:'No aguanta heladas: fuera de Canarias o la costa más cálida, mejor en maceta para meterla dentro en invierno.'},
 apio:{s:'Semillero casi en superficie (germina despacio, 2–3 semanas). Trasplanta a 30 cm.',r:'Abundante y constante: con sed se vuelve fibroso.',l:'Sol o semisombra.',t:'Fértil, fresco y con mucha materia orgánica.',a:'Compost generoso al plantar y algo a mitad de cultivo.',p:'Babosas, pulgón y mosca del apio.',c:'Corta las pencas exteriores o la planta entera cuando esté gruesa.',b:'Puerro, tomate, judía, col.',e:'Maíz y perejil.',k:'Aporca o envuelve las pencas 2–3 semanas antes de cosechar para que salgan más blancas y tiernas.'},
 escarola:{s:'Semillero a 0,5 cm a final de verano; trasplanta a 30 cm.',r:'Regular, sin encharcar.',l:'Sol suave o semisombra.',t:'Fresco y mullido.',a:'Compost suave al plantar.',p:'Babosas y pulgón.',c:'La planta entera cuando el cogollo esté formado.',b:'Lechuga, cebolla, zanahoria.',e:'—',k:'Ata las hojas o cúbrela una semana antes de cortarla para blanquear el centro y quitarle amargor.'},
 canonigos:{s:'Siembra directa a voleo o en líneas a 1 cm, de final de verano a invierno.',r:'Ligero y frecuente.',l:'Sol suave o semisombra.',t:'Cualquiera bien asentado; no hace falta cavar mucho.',a:'No necesita.',p:'Babosas.',c:'Corta las rosetas enteras a ras de suelo.',b:'Cebolla, puerro, fresa.',e:'—',k:'Aguanta muy bien el frío: es una de las pocas ensaladas para pleno invierno.'},
 kale:{s:'Semillero a 1 cm; trasplanta a 45 cm.',r:'Regular.',l:'Sol; semisombra en verano.',t:'Fértil y fresco.',a:'Compost al plantar.',p:'Oruga de la col, pulgón y pulguilla.',c:'Hoja a hoja desde abajo; la planta sigue produciendo meses.',b:'Cebolla, apio, eneldo, capuchina.',e:'Fresa y tomate.',k:'Con las heladas se vuelve más dulce.'},
 colbruselas:{s:'Semillero en primavera o principios de verano; trasplanta a 60 cm.',r:'Regular y profundo.',l:'Sol.',t:'Firme, fértil y algo calizo.',a:'Compost al plantar.',p:'Oruga de la col y pulgón ceniciento.',c:'Las coles de abajo arriba cuando estén prietas.',b:'Cebolla, apio, eneldo.',e:'Fresa y tomate.',k:'Aprieta la tierra alrededor del tallo: si queda suelta las coles salen abiertas.'},
 lombarda:{s:'Semillero a 1 cm; trasplanta a 50 cm.',r:'Regular.',l:'Sol.',t:'Fértil y fresco.',a:'Compost al plantar.',p:'Oruga de la col y pulgón.',c:'Cuando la cabeza esté dura al apretarla.',b:'Cebolla, apio, eneldo, capuchina.',e:'Fresa y tomate.',k:'Su color es más intenso con noches frescas.'},
 nabomesa:{s:'Siembra directa a 1–2 cm; aclara a 10–15 cm.',r:'Regular: con sequía se vuelve leñoso y picante.',l:'Sol o semisombra.',t:'Suelto y fresco.',a:'No necesita si el suelo tenía compost.',p:'Pulguilla y mosca de la col.',c:'Raíces del tamaño de una pelota de tenis; las hojas (grelos) también se comen.',b:'Guisante, lechuga.',e:'Patata.',k:'Siémbralo a final de verano para cosechar en otoño e invierno.'},
 chirivia:{s:'Siembra directa a 1 cm con semilla fresca del año; aclara a 10 cm.',r:'Regular hasta que nace; luego moderado.',l:'Sol.',t:'Profundo, suelto y sin piedras.',a:'No necesita; el estiércol fresco deforma la raíz.',p:'Mosca de la zanahoria.',c:'Cuando la raíz tenga buen grosor; mejora tras las primeras heladas.',b:'Cebolla, ajo, rábano.',e:'Zanahoria (comparten plagas).',k:'Tarda hasta 3 semanas en nacer: marca la línea con rábanos, que salen antes.'},
 hinojo:{s:'Semillero o directa a 1 cm; aclara a 30 cm.',r:'Regular: la sequía lo hace espigar.',l:'Sol.',t:'Fértil y fresco.',a:'Compost al sembrar.',p:'Pulgón y babosas.',c:'El bulbo cuando tenga el tamaño de un puño.',b:'—',e:'Tomate, judía, cilantro, eneldo.',k:'Aporca el bulbo para que salga más blanco y tierno.'},
 lenteja:{s:'Siembra directa a 3 cm en líneas separadas 30 cm.',r:'Muy poco: es de secano.',l:'Pleno sol.',t:'Suelto y no encharcado.',a:'No necesita: fija nitrógeno.',p:'Gorgojo en la semilla guardada.',c:'Cuando las vainas estén secas y la planta amarilla.',b:'Cereales.',e:'Cebolla y ajo.',k:'Guarda las lentejas unos días en el congelador para matar posibles gorgojos.'},
 cacahuete:{s:'Siembra directa la semilla sin cáscara a 4–5 cm, separadas 25 cm, con la tierra caliente.',r:'Regular en floración; poco al final.',l:'Pleno sol y calor.',t:'Arenoso y muy suelto.',a:'Algo de calcio; no necesita nitrógeno.',p:'Pájaros y ratones en la semilla.',c:'Cuando las hojas amarillean: arranca la planta entera y sécala al sol.',b:'Maíz, patata.',e:'—',k:'Tras la flor, el tallo se entierra y forma el cacahuete bajo tierra: mantén el suelo suelto.'},
 okra:{s:'Semillero o directa a 2 cm; remoja la semilla una noche antes.',r:'Regular.',l:'Pleno sol y mucho calor.',t:'Fértil y bien drenado.',a:'Compost al plantar.',p:'Pulgón y hormigas.',c:'Vainas tiernas de 7–10 cm, cada 2–3 días.',b:'Pimiento, berenjena, pepino.',e:'—',k:'Si dejas crecer las vainas se vuelven duras y la planta deja de producir.'},
 chalota:{s:'Planta los bulbillos a ras de suelo en otoño o final de invierno, a 20 cm.',r:'Poco; nada al final.',l:'Sol.',t:'Suelto y bien drenado.',a:'No necesita.',p:'Mildiu y mosca de la cebolla.',c:'Cuando las hojas se doblen y amarilleen.',b:'Zanahoria, lechuga, remolacha.',e:'Guisante, judía, haba.',k:'Cada bulbillo da un racimo de 6–10 chalotas.'},
 pakchoi:{s:'Semillero o directa a 1 cm; aclara a 20 cm.',r:'Frecuente.',l:'Sol suave o semisombra.',t:'Fértil y fresco.',a:'Compost al sembrar.',p:'Pulguilla, babosas y oruga de la col.',c:'Entera o hoja a hoja a las 6–7 semanas.',b:'Cebolla, apio, lechuga.',e:'Fresa.',k:'Con calor espiga enseguida: siémbralo en otoño o primavera temprana.'},
 lima:{s:'En cepellón en primavera, con el injerto por encima del suelo.',r:'Regular; nunca encharcar.',l:'Pleno sol y resguardado.',t:'Suelto y bien drenado.',a:'Abono para cítricos de primavera a otoño.',p:'Cochinilla, pulgón y minador.',c:'Verde y brillante, cuando ceda un poco al apretar.',b:'Caléndula, capuchina.',e:'—',o:'Ligera tras la cosecha: aclara el interior y quita chupones.',k:'Es el cítrico más friolero: en maceta podrás resguardarlo en invierno.'},
 pomelo:{s:'En cepellón en primavera, con el injerto por encima del suelo.',r:'Regular, sobre todo en verano.',l:'Pleno sol y calor.',t:'Suelto y bien drenado.',a:'Abono para cítricos de primavera a otoño.',p:'Cochinilla, pulgón y mosca de la fruta.',c:'En invierno y primavera; aguanta mucho en el árbol.',b:'Caléndula, capuchina.',e:'—',o:'Ligera tras la cosecha: limpia el interior y las ramas bajas.',k:'Necesita mucho calor en verano para endulzar.'},
 kumquat:{s:'En cepellón en primavera.',r:'Regular, dejando secar la superficie.',l:'Pleno sol.',t:'Suelto y ligeramente ácido.',a:'Abono para cítricos de primavera a otoño.',p:'Cochinilla y pulgón.',c:'Cuando estén naranjas: se comen con piel.',b:'Caléndula.',e:'—',o:'Casi no necesita; solo forma y limpieza.',k:'Es el cítrico que mejor aguanta en maceta y algo de frío.'},
 chumbera:{s:'Planta una pala (penca) en verano, enterrada un tercio tras dejarla secar una semana.',r:'Casi nunca: solo el primer verano.',l:'Pleno sol.',t:'Pobre, pedregoso y muy drenado.',a:'No necesita.',p:'Cochinilla del carmín (manchas blancas algodonosas).',c:'A final de verano, con guantes y pinzas: los higos tienen púas finísimas.',b:'—',e:'—',o:'Quita palas viejas o mal colocadas a final de invierno.',k:'Frota los higos con un cepillo o pasa agua a presión para quitar las púas antes de pelarlos.'},
 avellano:{s:'Raíz desnuda en invierno; mejor dos variedades para polinizar.',r:'Regular en verano: es de clima fresco.',l:'Sol o semisombra en zonas calurosas.',t:'Fresco y profundo.',a:'Compost en invierno.',p:'Balanino (gusano de la avellana) y pulgón.',c:'Cuando caen al suelo a final de verano.',b:'—',e:'—',o:'Quita los chupones de la base cada invierno y aclara el centro.',k:'Florece en pleno invierno: los amentos amarillos son las flores masculinas.'},
 pistachero:{s:'En cepellón en invierno; hace falta un pie macho por cada 8–10 hembras.',r:'Muy poco: aguanta la sequía, pero da más con algún riego en verano.',l:'Pleno sol y calor seco.',t:'Profundo, calizo y muy drenado.',a:'Compost en invierno.',p:'Hongos con humedad.',c:'A final de verano, cuando la cáscara se abre y el fruto se suelta.',b:'—',e:'—',o:'Poda de formación en vaso los primeros años; luego poca.',k:'Tarda en entrar en producción y alterna años buenos y flojos.'},
 maracuya:{s:'En cepellón en primavera, junto a una valla o pérgola.',r:'Regular en verano; poco en invierno.',l:'Pleno sol y resguardado.',t:'Fértil y bien drenado.',a:'Compost y abono rico en potasio en primavera y verano.',p:'Pulgón y araña roja.',c:'Cuando el fruto se arruga y cae solo.',b:'—',e:'—',o:'A final de invierno acorta las ramas laterales: fructifica en la madera nueva.',k:'Es una trepadora vigorosa: necesita apoyo desde el principio.'},
 guayabo:{s:'En cepellón en primavera.',r:'Regular en verano.',l:'Pleno sol.',t:'Cualquiera bien drenado.',a:'Compost en primavera.',p:'Mosca de la fruta y cochinilla.',c:'Cuando cambia a amarillo y desprende aroma.',b:'—',e:'—',o:'Ligera tras la cosecha para mantenerlo bajo.',k:'En la costa de Cádiz y Málaga se cría bien al aire libre.'},
 hierbabuena:{s:'Por esqueje o trozo de raíz en primavera.',r:'Frecuente: le gusta la tierra húmeda.',l:'Semisombra.',t:'Fresco y fértil.',a:'Compost en primavera.',p:'Roya y pulgón.',c:'Corta los tallos por encima de un par de hojas.',b:'Col, tomate.',e:'Manzanilla y perejil.',k:'Es invasora: mejor en maceta o con barrera en el suelo.'},
 melisa:{s:'Semillero en primavera o división de mata.',r:'Regular.',l:'Sol suave o semisombra.',t:'Fresco y fértil.',a:'Compost en primavera.',p:'Casi ninguna.',c:'Hojas antes de la floración, cuando más huelen a limón.',b:'Tomate, calabaza.',e:'—',k:'Atrae a las abejas: ponla cerca de los frutales.'},
 estragon:{s:'Por división de mata o esqueje; el estragón francés no da semilla.',r:'Moderado; no tolera el encharcamiento.',l:'Sol.',t:'Suelto y drenado.',a:'Poco.',p:'Roya.',c:'Hojas jóvenes de primavera a otoño.',b:'Berenjena, pimiento.',e:'—',k:'Renueva la mata dividiéndola cada 3–4 años.'},
 laurel:{s:'En cepellón en otoño o primavera; por esqueje es lento.',r:'Poco una vez asentado.',l:'Sol o semisombra.',t:'Cualquiera bien drenado.',a:'Compost en primavera.',p:'Cochinilla y psila del laurel (hojas enrolladas).',c:'Hojas todo el año; sécalas a la sombra.',b:'—',e:'—',k:'Aguanta muy bien la poda: sirve de seto o en maceta grande.'},
 hierbaluisa:{s:'Por esqueje en primavera o en cepellón.',r:'Regular en verano.',l:'Pleno sol y resguardada del frío.',t:'Suelto y drenado.',a:'Compost en primavera.',p:'Araña roja.',c:'Hojas en verano, antes y durante la floración.',b:'—',e:'—',k:'Pierde las hojas en invierno; poda fuerte a final de invierno y rebrota.'},
 stevia:{s:'Semillero en primavera o esqueje.',r:'Regular, sin encharcar.',l:'Pleno sol.',t:'Suelto y ligeramente ácido.',a:'Compost suave.',p:'Pulgón.',c:'Hojas antes de la floración, cuando son más dulces.',b:'—',e:'—',k:'Es friolera: en invierno resguárdala o mantenla en maceta.'},
 citronela:{s:'Por división de mata en primavera.',r:'Regular en verano.',l:'Pleno sol y calor.',t:'Fértil y drenado.',a:'Compost en primavera.',p:'Casi ninguna.',c:'Tallos enteros desde la base.',b:'Tomate, pimiento.',e:'—',k:'Su aroma ahuyenta a los mosquitos al rozar las hojas.'},
 poleo:{s:'Por esqueje o división en primavera.',r:'Frecuente: le gusta la humedad.',l:'Sol o semisombra.',t:'Fresco.',a:'Poco.',p:'Roya.',c:'Tallos en floración para infusión.',b:'Col.',e:'—',k:'No lo uses en infusión durante el embarazo.'},
 altramuz:{s:'Siembra directa a 3–4 cm en otoño.',r:'Muy poco: es de secano.',l:'Sol.',t:'Ácido o neutro, arenoso.',a:'No necesita: fija nitrógeno.',p:'Pulgón.',c:'Para forraje en floración; el grano cuando las vainas estén secas.',b:'Cereales.',e:'—',k:'El grano es amargo: hay que cocerlo y dejarlo en agua varios días antes de comerlo.'},
 zulla:{s:'Siembra directa a 1–2 cm en otoño.',r:'Muy poco.',l:'Sol.',t:'Arcilloso y calizo.',a:'No necesita.',p:'Casi ninguna.',c:'Corta en floración.',b:'Cereales.',e:'—',k:'Muy de la campiña de Cádiz: mejora los suelos arcillosos.'},
 centeno:{s:'Siembra a voleo a 2–3 cm en otoño.',r:'Muy poco.',l:'Sol.',t:'Cualquiera, incluso pobre o ácido.',a:'Poco.',p:'Cornezuelo en espigas húmedas.',c:'Siega en verde antes de espigar.',b:'Veza.',e:'—',k:'Es el cereal más resistente al frío y a los suelos pobres.'},
 clavel:{s:'Semillero en primavera o esqueje.',r:'Moderado, sin mojar las flores.',l:'Pleno sol.',t:'Suelto y calizo.',a:'Abono para flor en primavera.',p:'Pulgón, roya y araña roja.',c:'Corta las flores pasadas.',b:'Rosal.',e:'—',k:'Los esquejes de tallos sin flor enraízan con facilidad.'},
 cesped:{s:'A voleo, unos 35 g por m², sobre tierra rastrillada y nivelada; cubre con medio centímetro de mantillo y pasa el rodillo o pisa con una tabla.',r:'Hasta que nazca, riegos cortos varias veces al día para que no se seque la superficie; después, riegos profundos 2–3 veces por semana en verano, mejor al amanecer.',l:'Sol; para semisombra, mezclas con festuca.',t:'Suelto, bien drenado y nivelado, sin piedras ni raíces.',a:'Abono de césped en primavera y al final del verano.',p:'Hongos con exceso de riego o de noche húmeda, gusanos grises y musgo en la sombra.',c:'Primera siega a 8–10 cm cortando solo las puntas; luego a 4–5 cm, sin quitar nunca más de un tercio. En verano, déjalo más alto.',b:'Trébol.',e:'—',k:'En zonas de clima cálido, siembra en otoño: nace con las lluvias y llega fuerte al verano. Para mucho calor y poca agua, mejor mezclas con grama (bermuda) o festuca.'},
 margarita:{s:'Semillero en primavera u otoño; también por división.',r:'Regular.',l:'Pleno sol.',t:'Cualquiera bien drenado.',a:'Abono para flor en primavera.',p:'Pulgón.',c:'Corta las flores pasadas para que siga floreciendo.',b:'Rosal.',e:'—',k:'Recórtala tras la floración para que no se abra por el centro.'},
 dalia:{s:'Planta los tubérculos en primavera a 10 cm de profundidad.',r:'Abundante en verano.',l:'Pleno sol.',t:'Fértil y bien drenado.',a:'Abono para flor durante el verano.',p:'Babosas, pulgón y tijeretas.',c:'Corta flores para jarrón: florece más.',b:'—',e:'—',k:'En zonas sin heladas puedes dejar los tubérculos en tierra en invierno.'},
 gitanilla:{s:'Por esqueje en primavera o final de verano.',r:'Cuando se seque la superficie.',l:'Sol; en verano mejor sin el sol de la tarde.',t:'Sustrato universal drenado.',a:'Abono para flor cada 15 días en primavera y verano.',p:'Taladro del geranio (orugas dentro de los tallos).',c:'Florece de primavera a otoño.',b:'—',e:'—',k:'Ideal para colgar de balcones y rejas.'},
 begonia:{s:'Por esqueje de hoja o tallo.',r:'Moderado, sin mojar las hojas.',l:'Luz indirecta o semisombra.',t:'Sustrato ligero y aireado.',a:'Abono para flor en primavera y verano.',p:'Oídio y cochinilla.',c:'Florece buena parte del año.',b:'—',e:'—',k:'No pulverices las hojas: se manchan y cogen hongos.'},
 kalanchoe:{s:'Por esqueje de hoja o tallo.',r:'Escaso: deja secar entre riegos.',l:'Mucha luz.',t:'Sustrato para cactus.',a:'Abono para crasas en primavera.',p:'Cochinilla y podredumbre si se riega de más.',c:'Florece en invierno y primavera.',b:'—',e:'—',k:'Para que vuelva a florecer necesita noches largas en otoño.'},
 ficus:{s:'Por esqueje de tallo o acodo aéreo.',r:'Cuando se seque la mitad superior del sustrato.',l:'Mucha luz indirecta, sin cambiarlo de sitio.',t:'Sustrato universal aireado.',a:'Abono verde cada mes en primavera y verano.',p:'Cochinilla y araña roja.',c:'Planta de hoja, todo el año.',b:'—',e:'—',k:'Limpia el polvo de las hojas con un paño húmedo para que respire.'},
 espatifilo:{s:'Por división de mata al trasplantar.',r:'Regular: avisa con las hojas caídas cuando tiene sed.',l:'Luz indirecta; tolera poca luz.',t:'Sustrato universal fresco.',a:'Abono cada mes en primavera y verano.',p:'Cochinilla y puntas secas con ambiente seco.',c:'Flores blancas en primavera y verano.',b:'—',e:'—',k:'Riega con agua sin cal o reposada si se le secan las puntas.'},
 lantana:{s:'Por esqueje en primavera.',r:'Moderado; aguanta la sequía.',l:'Pleno sol.',t:'Cualquiera bien drenado.',a:'Poco.',p:'Mosca blanca.',c:'Florece de primavera a otoño.',b:'—',e:'—',o:'Poda fuerte a final del invierno.',k:'Sus bayas son tóxicas: cuidado con niños y mascotas.'},
};

const INDOOR=['potos','monstera','sansevieria','dracaena','cinta','orquidea','calathea','zamioculca','plectranto','gollum','jade','pilea'];
const ACTIONS={riego:'Riego',abono:'Abonado',sustrato:'Sustrato',poda:'Poda'};
const VERB={riego:'Regar',abono:'Abonar',sustrato:'Cambiar sustrato',poda:'Podar'};
// Intervalos largos en años (poda, sustrato)
const ivTxt=d=>d>=365&&d%365===0?(d===365?'cada año':`cada ${d/365} años`):`cada ${d} días`;

const DAY=864e5;
const today=new Date();today.setHours(0,0,0,0);
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const ago=n=>iso(new Date(today.getTime()-n*DAY));
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const curM=today.getMonth();

function load(k,def){try{const v=store.getItem(k);return v?JSON.parse(v):def}catch(e){return def}}
function save(k,v){try{store.setItem(k,JSON.stringify(v))}catch(e){}}

const EXAMPLES=[
 {id:'e1',name:'Tomates cherry',sp:'tomate',loc:'exterior',sown:ago(150),log:{riego:ago(4),abono:ago(12),sustrato:ago(150)},ej:1},
 {id:'e2',name:'Lechugas del bancal',sp:'lechuga',loc:'exterior',sown:ago(20),log:{riego:ago(2),abono:ago(20),sustrato:ago(20)},ej:1},
 {id:'e3',name:'Albahaca de la cocina',sp:'albahaca',loc:'interior',sown:ago(70),log:{riego:ago(0),abono:ago(35),sustrato:ago(70)},ej:1},
 {id:'e4',name:'Potos del salón',sp:'potos',loc:'interior',sown:ago(600),log:{riego:ago(5),abono:ago(10),sustrato:ago(740)},ej:1},
 {id:'e5',name:'Geranios del balcón',sp:'geranio',loc:'exterior',sown:ago(400),log:{riego:ago(3),abono:ago(16),sustrato:ago(380)},ej:1},
 {id:'e6',name:'Alfalfa para las gallinas',sp:'alfalfa',loc:'exterior',sown:ago(60),log:{riego:ago(4)},ej:1},
 // Ejemplos con tareas atrasadas
 {id:'e7',name:'Pimientos del huerto',sp:'pimiento',loc:'exterior',sown:ago(120),log:{riego:ago(9),abono:ago(40),sustrato:ago(120)},ej:1},
 {id:'e8',name:'Monstera del estudio',sp:'monstera',loc:'interior',sown:ago(500),log:{riego:ago(14),abono:ago(50),sustrato:ago(500)},ej:1},
 {id:'e9',name:'Perejil de la ventana',sp:'perejil',loc:'interior',sown:ago(45),log:{riego:ago(6),abono:ago(45),sustrato:ago(45)},ej:1},
 {id:'e10',name:'Caléndulas del patio',sp:'calendula',loc:'exterior',sown:ago(90),log:{riego:ago(8),abono:ago(33),sustrato:ago(90)},ej:1},
 {id:'e11',name:'Limonero del patio',sp:'limonero',loc:'exterior',sown:ago(730),log:{riego:ago(3),abono:ago(30),poda:ago(200)},ej:1}
];
let photos=load('hv.photos',{});
// Las plantas de ejemplo desaparecen solas en cuanto hay una planta propia
function dropExamples(){const ex=state.plants.filter(p=>p.ej);if(!ex.length)return false;
  state.plants=state.plants.filter(p=>!p.ej);ex.forEach(p=>delete photos[p.id]);try{store.setItem('hv.photos',JSON.stringify(photos))}catch(e){}return true}
// Cada foto necesita un id único: si dos fotos comparten id, al cambiar la fecha de una se "cambian" todas
function newId(){return 'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
(()=>{const seen=new Set();let fixed=false;for(const k in photos)for(const x of photos[k]||[]){if(!x.id||seen.has(x.id)){x.id=newId();fixed=true}seen.add(x.id)}
  if(fixed)try{store.setItem('hv.photos',JSON.stringify(photos))}catch(e){}})();
let wx=loadWx(); // Tiempo real de la zona (ver «El tiempo»)
let seedsInit=load('hv.seeds',[]);
const MOBILE=matchMedia('(max-width:600px)');
let state={tipSel:null,mode:'crop',plantSel:null,photoBig:null,zone:(z=>OLD_ZONES[z]||(ZONES[z]?z:'sevilla'))(load('hv.zone','sevilla')),alt:load('hv.alt',null),plants:load('hv.plants',EXAMPLES),calSpan:load('hv.calspan','mes'),calGroup:'todos',plGroup:'todos',plLoc:'todas',sel:null,seeds:seedsInit};
// Añade una sola vez los ejemplos nuevos a quien ya tenía datos guardados
if(load('hv.seedV',1)<2){const have=new Set(state.plants.map(p=>p.id));EXAMPLES.filter(e=>['e7','e8','e9','e10'].includes(e.id)&&!have.has(e.id)).forEach(e=>state.plants.push(e));save('hv.plants',state.plants);save('hv.seedV',2)}
if(load('hv.seedV',1)<3){if(!state.plants.some(p=>p.id==='e11')){state.plants.push(EXAMPLES.find(e=>e.id==='e11'));save('hv.plants',state.plants)}save('hv.seedV',3)}
if(load('hv.seedV',1)<4){const e=state.plants.find(p=>p.id==='e11');if(e){e.log=e.log||{};e.log.poda=e.log.poda||ago(200);save('hv.plants',state.plants)}save('hv.seedV',4)}
// Las plantas nuevas se creaban con todos los cuidados anotados el día de siembra y salían como «hechos».
// La fecha de siembra ya es la referencia si no hay registro, así que se quitan esas anotaciones automáticas.
if(load('hv.seedV',1)<5){for(const p of state.plants){if(p.ej||!p.log)continue;for(const a of Object.keys(p.log))if(p.log[a]===p.sown)delete p.log[a]}save('hv.plants',state.plants);save('hv.seedV',5)}
if(load('hv.seedV',1)<6){if(state.plants.some(p=>!p.ej)){dropExamples();save('hv.plants',state.plants)}save('hv.seedV',6)}

// ---------- Calendario ----------
// ---------- Asociaciones y rotación ----------
// Las compañeras salen de las fichas de Consejos («Buenas compañeras» y «Mejor lejos de»), y se aplican en los dos sentidos
const REL=(()=>{
  const norm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const keys=SPECIES.map(x=>[x.id,new RegExp('\\b'+norm(x.n.split(/[ (]/)[0])+'(s|es)?\\b')]);
  const find=t=>{t=norm(t);return keys.filter(([,re])=>re.test(t)).map(k=>k[0])};
  const r=Object.fromEntries(SPECIES.map(x=>[x.id,{good:new Set(),bad:new Set()}]));
  for(const x of SPECIES){const t=TIPS[x.id]||{};
    for(const id of find(t.b))if(id!==x.id){r[x.id].good.add(id);r[id].good.add(x.id)}
    for(const id of find(t.e))if(id!==x.id){r[x.id].bad.add(id);r[id].bad.add(x.id)}}
  for(const x of SPECIES)for(const id of r[x.id].bad)r[x.id].good.delete(id);
  return r;
})();
// Rotación en cuatro grupos: tras las exigentes de fruto, leguminosas; tras ellas, hoja; tras la hoja, raíz y bulbo; y vuelta a empezar
const ROT={
  fruto:{n:'de fruto y muy exigente',next:'legum',why:'leguminosas, que devuelven a la tierra el nitrógeno que ha gastado',ids:['tomate','pimiento','berenjena','patata','calabacin','pepino','melon','sandia','calabaza','maiz','boniato','okra']},
  legum:{n:'leguminosa y deja la tierra rica en nitrógeno',next:'hoja',why:'plantas de hoja y coles, que aprovechan ese nitrógeno',ids:['judia','haba','garbanzo','guisante','lenteja','cacahuete']},
  hoja:{n:'de hoja',next:'raiz',why:'raíces y bulbos, que piden menos abono',ids:['lechuga','espinaca','acelga','col','brocoli','coliflor','rucula','apio','escarola','canonigos','kale','colbruselas','lombarda','pakchoi','hinojo']},
  raiz:{n:'de raíz o bulbo',next:'fruto',why:'plantas de fruto, añadiendo antes compost',ids:['zanahoria','rabano','remolacha','cebolla','ajo','puerro','nabo','nabomesa','chirivia','chalota']},
};
const FAM=Object.fromEntries(Object.entries(ROT).flatMap(([f,v])=>v.ids.map(id=>[id,f])));
// Qué sembrar en el hueco: las del grupo siguiente que se pueden sembrar este mes o el que viene
function rotNext(id){
  const f=FAM[id];if(!f)return null;const nf=ROT[f].next,z=zoneNow();
  const now=ROT[nf].ids.filter(x=>SP[x]&&(cellState(SP[x],z,curM)||cellState(SP[x],z,(curM+1)%12)));
  return {f,nf,now};
}
const mine=(id,loc)=>state.plants.filter(q=>q.sp===id&&(!loc||q.loc===loc));
// Dos plantas están cerca si en el plano están en el mismo huerto a 1,2 m o menos; si alguna no está en el plano, si comparten sitio (interior/exterior)
const near=(a,b)=>a.pos&&b.pos?(a.pos.h||'h1')===(b.pos.h||'h1')&&Math.hypot(a.pos.x-b.pos.x,a.pos.y-b.pos.y)<=1.2:a.loc===b.loc;
const mineNear=(id,p)=>state.plants.filter(q=>q.sp===id&&q.id!==p.id&&near(p,q));
function foesNear(p){return [...REL[p.sp].bad].filter(id=>mineNear(id,p).length)}
function cellState(s,z,m){
  if(directa(s,z,m)) return 'directa';
  // semillero: aún hace frío fuera, pero en 1-2 meses se podrá trasplantar
  const t=z.t[m];
  if(s.seed&&t>=s.tMin-6&&t<s.tMin&&(directa(s,z,(m+1)%12)||directa(s,z,(m+2)%12))) return 'semillero';
  if(s.tree&&!treeFits(s,z)&&potMonths(s,z).includes(m)) return 'maceta';
  return '';
}
// Frutales que no aguantan el invierno de la zona: meses buenos para plantarlos en maceta y resguardarlos.
// De marzo a junio y septiembre, para que arraigue antes del frío; de esos, los de temperatura adecuada o, si ninguno llega, los más cálidos.
function potMonths(s,z){
  const ok=[2,3,4,5,8];
  const fit=ok.filter(m=>z.t[m]>=s.tMin&&z.t[m]<=s.tMax);if(fit.length)return fit;
  const top=Math.max(...ok.map(m=>z.t[m]));return ok.filter(m=>z.t[m]>=top-2);
}
function directa(s,z,m){
  const t=z.t[m];
  if(!treeFits(s,z))return false;
  if(s.tree){
    // nunca en pleno verano; los de hoja caduca, en reposo (noviembre a marzo) aunque el invierno sea suave
    if(m===6||m===7)return false;
    if(s.dec)return [10,11,0,1,2].includes(m)&&t>=s.tMin;
  }
  if(t<s.tMin||t>s.tMax) return false;
  // cultivos de calor: los dos meses siguientes no deben enfriarse demasiado para que llegue a producir
  if(s.tMin>=14) return z.t[(m+1)%12]>=s.tMin-2&&z.t[(m+2)%12]>=s.tMin-2;
  return true;
}
// Frutales: algunos necesitan frío invernal y otros no aguantan heladas
// Las heladas sí descartan; la falta de frío no: hay variedades de pocas horas de frío
function treeFits(s,z){const w=Math.min(...z.t);return !(s.frost&&w<s.frost)}
function lowChill(s,z){return !!(s.chill&&Math.min(...z.t)>s.chill)}
function chillTxt(s){return `Tu invierno es suave para el ${s.n.toLowerCase()} común: elige variedades de pocas horas de frío${s.lc?`, como ${s.lc}`:''}.`}
function treeWhy(s,z){const w=Math.min(...z.t);return s.frost&&w<s.frost?'Los inviernos de tu zona son demasiado fríos: si quieres tenerlo, mejor en maceta grande y resguardado.':''}
function ranges(months){
  if(!months.length) return 'ningún mes';
  const set=new Set(months);
  if(set.size===12) return 'todo el año';
  // empezar justo después de un mes vacío, para unir diciembre con enero
  const gap=[...Array(12).keys()].find(m=>!set.has(m));
  const out=[];let run=null;
  for(let k=1;k<=12;k++){const m=(gap+k)%12;
    if(set.has(m)){run=run?[run[0],m]:[m,m]}
    else if(run){out.push(run[0]===run[1]?MONTHS_L[run[0]]:MONTHS_L[run[0]]+' a '+MONTHS_L[run[1]]);run=null}}
  return out.join(', ');
}
function renderCal(){
  const z=zoneNow();
  document.getElementById('calLede').innerHTML=`<span>Toca un cultivo para abrir su ficha.</span>`;
  const groups=['todos',...Object.keys(GROUPS)];
  document.getElementById('calGroups').innerHTML=groups.map(g=>`<button class="chip" data-g="${g}" aria-pressed="${state.calGroup===g}">${g==='todos'?'Todos':GROUPS[g]}</button>`).join('');
  const gs=document.getElementById('calGroupSel');if(gs&&gs.value!==state.calGroup){gs.value=state.calGroup;gs._cselDraw&&gs._cselDraw()}
  const list=SPECIES.filter(s=>!s.pot&&(state.calGroup==='todos'||s.g===state.calGroup));
  // Ordenador: buscador, «Todo el año» / «Este mes» y «Con tus semillas» sobre la tabla
  const has=new Set(state.seeds.map(x=>x.sp)),grown=new Set(state.plants.filter(p=>!p.ej).map(p=>p.sp));
  const span=state.calSpan||'mes',q=cselNorm(document.getElementById('calQ').value.trim()),dk=!MOBILE.matches;
  document.querySelectorAll('#calSpan [data-span]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.span===span));
  document.getElementById('calSeeds').setAttribute('aria-pressed',!!state.calSeeds);
  const rows=dk?list.filter(s=>(!q||cselNorm(s.n).includes(q))&&(span==='year'||cellState(s,z,curM))&&(!state.calSeeds||has.has(s.id))):list;
  const nowCls=m=>m===curM?' now':'';
  let h=`<thead><tr><th class="name" scope="col">Cultivo</th>${MONTHS.map((m,i)=>`<th scope="col" class="${nowCls(i).trim()}" title="${MONTHS_L[i]}"><span class="ml">${m}</span><span class="ms" aria-hidden="true">${m[0]}</span></th>`).join('')}</tr></thead><tbody>`;
  // Guiones de corte para los nombres largos en la columna estrecha del móvil
  const SHY={Pensamiento:'Pensa&shy;miento',Melocotonero:'Meloco&shy;tonero',Albaricoquero:'Albari&shy;coquero',Nectarino:'Necta&shy;rino',Pistachero:'Pista&shy;chero',Hierbabuena:'Hierba&shy;buena',Hierbaluisa:'Hierba&shy;luisa',Membrillero:'Membri&shy;llero'};
  const nm=n=>n.split(' ').map(w=>SHY[w]||w).join(' ');
  // Con «Todos», un título de grupo antes de cada tipo de cultivo
  const gk=Object.keys(GROUPS);let lastG=null;
  const nNow=g=>rows.filter(s=>s.g===g&&cellState(s,z,curM)).length;
  for(const s of [...rows].sort((a,b)=>gk.indexOf(a.g)-gk.indexOf(b.g))){
    if(state.calGroup==='todos'&&s.g!==lastG){lastG=s.g;const n=dk&&nNow(s.g);h+=`<tr class="grp"><th colspan="13" scope="colgroup">${s.g==='alimentario'?'Alimentarios':GROUPS[s.g]}${n?`<span class="gn"> · ${n} ${n===1?'se puede':'se pueden'} sembrar en ${MONTHS_L[curM]}</span>`:''}</th></tr>`}
    const mk=dk&&(has.has(s.id)||grown.has(s.id))?`<span class="cmk">${[has.has(s.id)?'🌱 semillas':'',grown.has(s.id)?'en tu huerto':''].filter(Boolean).join(' · ')}</span>`:'';
    h+=`<tr class="crop${state.sel===s.id?' sel':''}" data-sp="${s.id}"><th class="name" scope="row">${nm(s.n)}${mk}</th>`;
    for(let m=0;m<12;m++){const st=cellState(s,z,m);const luz=st&&!s.tree&&z.sun[m]<s.sun?' luz':'';
      const tip=st==='directa'?(s.tree?'Plantación':'Siembra directa'):st==='semillero'?'Semillero protegido':st==='maceta'?'En maceta resguardada':'No recomendado';
      h+=`<td class="${nowCls(m).trim()}"><div class="cell ${st}${luz}" title="${s.n}, ${MONTHS_L[m]}: ${tip}${luz?' (pocas horas de sol)':''}"></div></td>`}
    h+='</tr>';
  }
  if(!rows.length)h+=`<tr class="cempty"><td colspan="13">${q?'No hay cultivos con ese nombre.':state.calSeeds?'No tienes semillas de estos cultivos para sembrar ahora.':'No hay cultivos con estos filtros.'}</td></tr>`;
  document.getElementById('cal').innerHTML=h+'</tbody>';
  // Móvil: lo que se puede sembrar o plantar en el mes elegido (con flechas), antes de la tabla del año
  const cm=state.calM??curM;
  const qm=cselNorm(document.getElementById('calQm').value.trim()),hit=s=>!qm||cselNorm(s.n).includes(qm);
  const now=list.filter(hit).map(s=>({s,st:cellState(s,z,cm)})).filter(o=>o.st);
  // Con búsqueda, los cultivos que coinciden pero no tocan este mes también salen, aparte
  const off=qm?list.filter(s=>hit(s)&&!cellState(s,z,cm)).sort((a,b)=>a.n.localeCompare(b.n,'es')):[];
  const kinds=new Set(now.map(o=>o.st));
  const ord={directa:0,semillero:1,maceta:2},srt=(x,y)=>x.st===y.st?x.s.n.localeCompare(y.s.n,'es'):ord[x.st]-ord[y.st];
  const chip=o=>`<button class="chip cn-${o.st==='directa'?'dir':o.st==='maceta'?'pot':'sem'}" type="button" data-sp="${o.s.id}"><span class="cn-n">${o.s.n}</span>${grown.has(o.s.id)?'<span class="cn-mine">🌱 en tu huerto</span>':''}</button>`;
  const grp=(t,a,cls='')=>`<section class="cn-grp${cls}"><h4>${t} <span class="n">${a.length}</span></h4><div class="chips">${a.sort(srt).map(chip).join('')}</div></section>`;
  const seeds=now.filter(o=>has.has(o.s.id));
  document.getElementById('calNowH').textContent=`Qué sembrar en ${MONTHS_L[cm]}`;
  document.getElementById('calNowN').textContent=now.length?`${now.length} ${now.length===1?'cultivo':'cultivos'} en tu zona${cm===curM?' · este mes':''}`:'';
  const offH=off.length?`<section class="cn-grp cn-off"><h4>No tocan en ${MONTHS_L[cm]} <span class="n">${off.length}</span></h4><div class="chips">${off.map(s=>`<button class="chip" type="button" data-sp="${s.id}"><span class="cn-n">${s.n}</span>${grown.has(s.id)?'<span class="cn-mine">🌱 en tu huerto</span>':''}</button>`).join('')}</div></section>`:'';
  document.getElementById('calNow').innerHTML=
    (now.length?(seeds.length?grp('Con tus semillas',seeds,' cn-seeds'):'')+
      Object.keys(GROUPS).map(g=>{const a=now.filter(o=>o.s.g===g&&!has.has(o.s.id));return a.length?grp(GROUPS[g],a):''}).join('')+
      `<p class="cn-lbl">${kinds.has('directa')?'<span><i class="cn-dir"></i>Siembra directa o plantación</span>':''}${kinds.has('semillero')?'<span><i class="cn-sem"></i>Semillero protegido</span>':''}${kinds.has('maceta')?'<span><i class="cn-pot"></i>En maceta resguardada</span>':''}</p>`
    :qm&&!off.length?`<p class="cn-none">No hay cultivos con ese nombre.</p>`:qm?'':`<p class="cn-none">En ${MONTHS_L[cm]} no toca sembrar nada de este grupo en tu zona.</p>`)+offH;
  const f=document.getElementById('ficha');if(f.open&&state.mode==='crop')renderFicha();
}
function renderFicha(){
  document.getElementById('ficha').classList.add('crop');document.getElementById('ficha').classList.remove('pfw');
  const z=zoneNow(),s=SP[state.sel];if(!s)return;
  const dir=[],sem=[],pot=[],dark=[];
  for(let m=0;m<12;m++){const st=cellState(s,z,m);if(st==='directa')dir.push(m);if(st==='semillero')sem.push(m);if(st==='maceta')pot.push(m);if(st&&!s.tree&&z.sun[m]<s.sun)dark.push(m)}
  const nowSt=cellState(s,z,curM);
  const nowTxt=s.tree&&pot.length?(nowSt?`Tus inviernos son demasiado fríos para tenerlo fuera, pero este mes (${MONTHS_L[curM]}) es buen momento para plantarlo en maceta y resguardarlo en invierno.`:`Tus inviernos son demasiado fríos para tenerlo fuera. En maceta resguardada, mejor plantarlo en ${ranges(pot).toLowerCase().replace(/, ([^,]*)$/,' y $1')}.`)
    :s.tree?(nowSt?`Este mes (${MONTHS_L[curM]}) es buen momento para plantarlo.`:treeWhy(s,z)||`Este mes (${MONTHS_L[curM]}) no es buen momento para plantarlo en tu zona.`)
    :nowSt==='directa'?`Este mes (${MONTHS_L[curM]}) puedes sembrarlo directamente fuera.`:nowSt==='semillero'?`Este mes (${MONTHS_L[curM]}) toca semillero protegido.`:`Este mes (${MONTHS_L[curM]}) no es buen momento en tu zona.`;
  const strip=MONTHS.map((m,i)=>{const st=cellState(s,z,i);const luz=st&&!s.tree&&z.sun[i]<s.sun?' luz':'';return `<div><span class="cell ${st}${luz}" title="${MONTHS_L[i]}"></span>${i===curM?`<b>${m[0]}</b>`:m[0]}</div>`}).join('');
  const c=s.care;const mine=state.plants.filter(p=>p.sp===s.id);
  if(state.quick){
    // Ficha rápida desde «Qué sembrar»: meses, temporada del mes elegido, consejo clave y dos acciones
    const cm=state.qFrom?curM:state.calM??curM,st=cellState(s,z,cm),M=MONTHS_L[cm][0].toUpperCase()+MONTHS_L[cm].slice(1),k=TIPS[s.id]?.k;
    const qTxt=st==='directa'?`${M} es buen momento para ${s.tree?'plantarlo':'sembrarla directamente fuera'}.`:st==='semillero'?`En ${MONTHS_L[cm]} toca semillero protegido.`:st==='maceta'?`En ${MONTHS_L[cm]} se puede plantar en maceta y resguardarlo en invierno.`:`En ${MONTHS_L[cm]} no toca en tu zona.`;
    const sub=[GROUPS[s.g],state.seeds.some(x=>x.sp===s.id)?'tienes semillas':'',mine.some(p=>!p.ej)?'en tu huerto':''].filter(Boolean).join(' · ');
    const back=state.plants.find(p=>p.id===state.qFrom);
    document.getElementById('fichaIn').innerHTML=`${back?`<button class="qback" type="button" id="fichaBack">‹ Volver a ${esc(back.name)}</button>`:''}
   <div class="hd"><div><h2 id="fichaTitle">${s.n}</h2><span class="sp">${sub}</span></div>
     <button class="x" id="fichaClose" aria-label="Cerrar ficha">×</button></div>
   <div class="tmonths" role="img" aria-label="Meses de siembra en tu zona">${MONTHS.map((l,m)=>{const x=cellState(s,z,m);return `<i class="${x==='directa'?'d':x?'s':''}${m===cm?' cur':''}">${l[0]}</i>`}).join('')}</div>
   <p class="qnow">${qTxt} Riego cada ${interval({sp:s.id,loc:INDOOR.includes(s.id)?'interior':'exterior'},'riego')} días.</p>
   ${k?`<div class="tkey"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg><div><b>Consejo clave</b>${k}</div></div>`:''}
   <div class="qacts"><button class="btn" type="button" id="fichaTips">Ver consejos</button><button class="btn primary" id="fichaAdd">+ Añadir a mis plantas</button></div>`;
    document.getElementById('ficha').classList.add('quick');return;
  }
  document.getElementById('ficha').classList.remove('quick');
  document.getElementById('fichaIn').innerHTML=`
   <div class="hd"><div><h2 id="fichaTitle">${s.n}</h2><span class="sp">${GROUPS[s.g]} · ${z.name}</span></div>
     <button class="x" id="fichaClose" aria-label="Cerrar ficha">×</button></div>
   <div class="now ${nowSt||(pot.length?'maceta':'no')}">${nowTxt}</div>
   <div class="strip" aria-label="Meses de siembra">${strip}</div>
   <div class="facts">
     ${s.tree?`<div class="fact"><span>${pot.length?'En maceta resguardada':'Plantación'}</span><strong>${cap(ranges(pot.length?pot:dir))}</strong></div>
     <div class="fact"><span>Cómo plantarlo</span><strong>${s.dec?'A raíz desnuda en invierno, o en cepellón':'En cepellón (maceta)'}</strong></div>`
     :`<div class="fact"><span>Siembra directa</span><strong>${cap(ranges(dir))}</strong></div>
     <div class="fact"><span>Semillero protegido</span><strong>${s.seed?cap(ranges(sem)):'No conviene trasplantar'}</strong></div>`}
     <div class="fact"><span>Temperatura media</span><strong>${s.tMin} a ${s.tMax} °C</strong></div>
     <div class="fact"><span>Sol</span><strong>${s.sun} h al día o más</strong></div>
     <div class="fact"><span>${s.tree?'Primera cosecha':s.g==='ornamental'?'Floración':'Cosecha'}</span><strong>${s.tree?`A los ${s.yrs} años aprox.`:(s.days>=365?(s.days<548?`Al año aprox.`:`A los ${Math.round(s.days/365)} años aprox.`):`A los ${s.days} días aprox.`)}</strong></div>
     <div class="fact"><span>Riego</span><strong>Cada ${c.riego} días de base</strong></div>
     ${c.abono?`<div class="fact"><span>Abono</span><strong>Cada ${c.abono} días</strong></div>`:''}
     ${s.pm?`<div class="fact"><span>Poda</span><strong>${s.pm}</strong></div>`:''}
     ${s.chill?`<div class="fact"><span>Frío invernal</span><strong>${lowChill(s,z)?'Elige variedades de bajo frío':'Lo necesita para dar fruto'}</strong></div>`:''}
     ${s.frost?`<div class="fact"><span>Heladas</span><strong>${s.frost>=9?'Las lleva mal':'Aguanta las suaves'}</strong></div>`:''}
     ${c.sustrato?`<div class="fact"><span>Sustrato en maceta</span><strong>Renovar cada ${Math.round(c.sustrato/30)} meses</strong></div>`:''}
   </div>
   ${lowChill(s,z)?`<p class="tip chill">${chillTxt(s)}</p>`:''}
   ${dark.length?`<p class="tip">En ${ranges(dark).toLowerCase()} hay menos horas de sol de las que necesita (${s.sun} h al día), así que plántalo en el rincón más soleado que tengas.</p>`:''}
   <p class="tip">El riego se ajusta solo al calor del mes en tu zona.</p>
   ${mine.length?`<div><p class="tip" style="margin-bottom:6px">Tus plantas de ${s.n.toLowerCase()}:</p><div class="mine">${mine.map(p=>`<button class="btn" data-open="${esc(p.id)}">${esc(p.name)} · fotos (${(photos[p.id]||[]).length})</button>`).join('')}</div></div>`:''}
   <button class="btn primary" id="fichaAdd">Añadir a mis plantas</button>`;
}
function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
// from: planta desde cuya ficha se abre (Compañeras); la ficha rápida tiene entonces «Volver»
function openFicha(id,quick,from){
  state.mode='crop';state.sel=id;state.qFrom=from||null;state.quick=!!quick&&(MOBILE.matches||!!from);renderCal();renderFicha();
  const f=document.getElementById('ficha');if(!f.open){try{f.showModal()}catch(e){f.setAttribute('open','')}}f.scrollTop=0;
}
function daysSince(p,d){return Math.max(0,Math.round((parse(d)-parse(p.sown))/DAY))}
function fdate(d){return parse(d).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
// ---------- Cosechas ----------
const HARV_U={kg:'kg',g:'g',ud:'unidades',manojo:'manojos'};
const canHarv=p=>SP[p.sp]&&SP[p.sp].g!=='ornamental';
const num=n=>n.toLocaleString('es-ES',{maximumFractionDigits:2});
// Suma lo cosechado en un año: los kilos y gramos juntos, y aparte unidades y manojos
function harvTot(list,y){
  const t={kg:0,ud:0,manojo:0};
  for(const h of list||[])if(!y||h.d.startsWith(y)){if(h.u==='g')t.kg+=h.q/1000;else t[h.u]=(t[h.u]||0)+h.q}
  return [t.kg?`${num(t.kg)} kg`:'',t.ud?`${num(t.ud)} ${t.ud===1?'unidad':'unidades'}`:'',t.manojo?`${num(t.manojo)} ${t.manojo===1?'manojo':'manojos'}`:''].filter(Boolean).join(' y ');
}
const YEAR=String(today.getFullYear());
function harvSec(p){
  if(!canHarv(p))return '';
  const list=(p.harv||[]).slice().sort((a,b)=>a.d<b.d?1:-1),last=list[0];
  const open=state.harvMore===p.id,shown=open?list:list.slice(0,3),tot=harvTot(list,YEAR);
  // Al corregir una cosecha, el mismo formulario se rellena con sus datos
  const ed=list.find(h=>h.id===state.harvEdit),ref=ed||last;
  return `<section class="pf-sec" id="harvSec"><div class="pf-sh"><h3>Cosechas${list.length?` <small>${list.length}</small>`:''}</h3></div>
    <div class="hf-new"><button class="btn primary" type="button" data-hnew="${esc(p.id)}">+ Anotar cosecha</button></div>
    ${tot?`<p class="harvtot">En ${YEAR} has cosechado <strong>${tot}</strong>.</p>`:'<p class="tip">Anota lo que vayas recogiendo y verás cuánto te da cada planta a lo largo de la temporada.</p>'}
    ${list.length?`<ul class="harvl">${shown.map(h=>`<li>${harvRow(h,fdate(h.d))}</li>`).join('')}</ul>
      ${list.length>3?`<button class="btn remmore rm-soon" type="button" id="harvMore">${open?'Ver menos':`Ver ${list.length-3} más`}</button>`:''}`:''}
  </section>`;
}
// ---------- Mis semillas ----------
const SEEDABLE=SPECIES.filter(s=>!s.tree&&!s.pot);
// Primer mes (desde este) en que se puede sembrar en la zona; null si no toca en todo el año
function nextSow(s){const z=zoneNow();for(let i=0;i<12;i++){const m=(curM+i)%12;if(cellState(s,z,m))return m}return null}
function seedRows(){
  return state.seeds.filter(x=>SP[x.sp]).map(x=>{const s=SP[x.sp],m=nextSow(s);return {x,s,m,now:m===curM,old:x.cad&&+x.cad<today.getFullYear(),last:x.cad&&+x.cad===today.getFullYear()}})
    .sort((a,b)=>((a.m??99)-curM+12)%12-((b.m??99)-curM+12)%12||a.s.n.localeCompare(b.s.n,'es'));
}
function renderSeeds(){
  const rows=seedRows(),more=state.remMore||(state.remMore={});
  document.getElementById('seedCount').textContent=rows.length?rows.length:'';
  const row=r=>`<div class="seed${r.now?' now':''}"><div><p><strong>${r.s.n}</strong>${r.x.note?` · ${esc(r.x.note)}`:''}</p>
    <p class="sub">${r.now?`<span class="tag">Toca sembrar</span>`:r.m!=null?`Desde ${MONTHS_L[r.m]}`:'No toca sembrarla en tu zona'}${r.old?` · <span class="cad old">caducaron en ${esc(r.x.cad)}: pueden germinar peor</span>`:r.last?` · <span class="cad">caducan este año</span>`:r.x.cad?` · caducan en ${esc(r.x.cad)}`:''}</p></div>
    <span class="seed-acts">${r.now?`<button class="btn act" type="button" data-sow="${esc(r.x.id)}">Sembrar</button>`:''}<button class="rm" type="button" data-rmseed="${esc(r.x.id)}" aria-label="Quitar las semillas de ${r.s.n}">×</button></span></div>`;
  const now=rows.filter(r=>r.now),later=rows.filter(r=>!r.now);
  const lim=(k,l)=>l.length<=3||more[k]?l.map(row).join('')+(l.length>3?`<button class="btn remmore rm-soon" type="button" data-remmore="${k}">Ver menos</button>`:''):l.slice(0,3).map(row).join('')+`<button class="btn remmore rm-soon" type="button" data-remmore="${k}">Ver ${l.length-3} más</button>`;
  document.getElementById('seedList').innerHTML=!rows.length?'<p class="note seednote">Apunta los sobres de semillas que tienes y aquí verás cuáles toca sembrar cada mes y cuáles están a punto de caducar.</p>'
    :(now.length?`<p class="remhead">Toca sembrar en ${MONTHS_L[curM]}</p>${lim('seednow',now)}`:'')+(later.length?`<p class="remhead">Más adelante</p>${lim('seedlater',later)}`:'');
}
function compSec(p){
  const r=REL[p.sp],rot=rotNext(p.sp);if(!r.good.size&&!r.bad.size&&!rot)return '';
  const chip=(id,bad)=>{const has=(bad?mineNear(id,p):mine(id)).length;return `<button type="button" class="cmp${has?(bad?' warn':' have'):''}" data-cmp="${id}">${SP[id].n}${has?(bad?' · la tienes cerca':' · la tienes'):''}</button>`};
  // Primero las que tienes y luego por orden alfabético
  const sort=ids=>[...ids].sort((a,b)=>(mine(b).length>0)-(mine(a).length>0)||SP[a].n.localeCompare(SP[b].n,'es'));
  const ic=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const head=(t,d,n)=>`<p class="cmpl">${ic(d)}${t}${n?` <span class="n">${n}</span>`:''}</p>`;
  return `<section class="pf-sec cmpsec"><div class="pf-sh"><h3>Compañeras</h3></div>
    ${r.good.size?`<div class="cmprow good">${head('Se lleva bien con','<path d="M5 12.5l4.5 4.5L19 7"/>',r.good.size)}<div class="cmps">${sort(r.good).map(id=>chip(id,0)).join('')}</div></div>`:''}
    ${r.bad.size?`<div class="cmprow bad">${head('Mejor lejos de','<path d="M6 6l12 12M18 6L6 18"/>',r.bad.size)}<div class="cmps">${sort(r.bad).map(id=>chip(id,1)).join('')}</div></div>`:''}
    ${rot?`<div class="cmprow rot">${head('Cuando acabe, en su sitio','<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>')}<p class="cmpt">${SP[p.sp].n} es ${ROT[rot.f].n}: después siembra ${ROT[rot.f].why}.</p>${rot.now.length?`<p class="cmpl2">Ahora en tu zona</p><div class="cmps">${rot.now.map(id=>`<button type="button" class="cmp" data-cmp="${id}">${SP[id].n}</button>`).join('')}</div>`:''}</div>`:''}
  </section>`;
}
function renderPlantFicha(){
  document.getElementById('ficha').classList.remove('crop','quick','pfw');
  const p=state.plants.find(x=>x.id===state.plantSel);if(!p)return;
  const s=SP[p.sp],ph=(photos[p.id]||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
  const big=ph.find(x=>x.id===state.photoBig)||ph[ph.length-1];
  const age=daysSince(p,iso(today));
  const fd=d=>parse(d).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  const photoSec=`   <section class="pf-sec">
     <div class="pf-sh"><h3>Diario de fotos${ph.length?` <small>${ph.length}</small>`:''}</h3><div class="pf-btns">
       ${ph.length?`<button class="btn" id="photoEditToggle" aria-pressed="${!!state.photoEdit}">${state.photoEdit?'Listo':'Editar fotos'}</button>`:''}
       <label class="btn primary upl" for="photoIn">Añadir foto<input type="file" id="photoIn" accept="image/*"></label></div></div>
     ${big?`${state.photoEdit?`<p class="tip">Cambia la fecha de cada foto o bórrala. Se ordenan solas de la más antigua a la más reciente.</p>`:''}
       <figure class="big"><img src="${img(big.src)}" alt="${esc(p.name)} el ${fdate(big.date)}"><figcaption><b>Día ${daysSince(p,big.date)}</b> · ${fdate(big.date)}</figcaption></figure>
       <div class="pgrid${state.photoEdit?' editing':''}">${ph.map(x=>`<figure class="ph"><button class="th" data-photo="${esc(x.id)}" aria-pressed="${x===big}" aria-label="Ver foto del día ${daysSince(p,x.date)}"><img src="${img(x.src)}" alt=""></button>
         ${state.photoEdit?`<button class="rm" data-rmphoto="${esc(x.id)}" aria-label="Borrar foto del día ${daysSince(p,x.date)}">×</button>
         <figcaption>Día ${daysSince(p,x.date)}<input type="date" class="phDate" data-pid="${esc(x.id)}" value="${esc(x.date)}" min="${esc(p.sown)}" max="${iso(today)}" aria-label="Fecha de la foto del día ${daysSince(p,x.date)}"></figcaption>`
         :`<figcaption>Día ${daysSince(p,x.date)}<small>${fd(x.date)}</small></figcaption>`}</figure>`).join('')}</div>
       <p class="tip">${ph.length>1&&ph[0].date!==ph[ph.length-1].date?`De la primera a la última foto han pasado ${daysSince(p,ph[ph.length-1].date)-daysSince(p,ph[0].date)} días.`:'Añade otra foto más adelante para ver cómo crece.'}</p>`
     :`<div class="empty-ph">Aún no hay fotos. Añade la primera y vuelve a hacer una cada pocas semanas para ver cómo crece.</div>`}
   </section>`;
  const age2=age===0?'Hoy':age>=365?`${(age/365).toFixed(1).replace('.0','').replace('.',',')} años`:`${age} días`;
  if(!state.editing)return renderPlantFichaM(p,s,age2,photoSec);
  document.getElementById('fichaIn').innerHTML=`
   <div class="pf-hd">
     <div class="pf-id">
       <h2 id="fichaTitle">${esc(p.name)}</h2>
     </div>
     <button class="x" id="fichaClose" aria-label="Cerrar ficha">×</button>
   </div>
   <div class="pf-row">
       <dl class="pf-meta"><div><dt>Ubicación</dt><dd>${p.loc==='interior'?'Interior':'Exterior'}</dd></div><div><dt>Especie</dt><dd>${s.n}</dd></div><div><dt>${s.tree?'Plantación':'Siembra'}</dt><dd>${fdate(p.sown)}</dd></div><div><dt>Edad</dt><dd>${age===0?'Hoy':age>=365?`${(age/365).toFixed(1).replace('.0','').replace('.',',')} años`:`${age} días`}</dd></div></dl>
       ${state.editing?'':`<span class="pf-acts"><button class="btn" id="sharePlantBtn">Compartir</button><button class="btn" id="editToggle" aria-expanded="false">Editar datos</button></span>`}
   </div>
   ${state.editing?'':harvSec(p)}
   ${state.editing?'':compSec(p)}
   ${state.editing?`<section class="pf-sec"><div class="pf-sh"><h3>Editar datos</h3></div><form class="add edit" id="editForm">
       <label for="eName">Nombre<input id="eName" required value="${esc(p.name)}"></label>
       <label for="eSp">Especie<select id="eSp">${fSp.innerHTML}</select></label>
       <label for="eLoc">Ubicación<select id="eLoc"><option value="exterior">Exterior</option><option value="interior">Interior</option></select></label>
       <label for="eDate">Sembrada o plantada<input id="eDate" type="date" value="${esc(p.sown)}" max="${iso(today)}"></label>
       <div style="display:flex;gap:8px;grid-column:1/-1"><button class="btn primary" type="submit">Guardar cambios</button><button class="btn" type="button" id="editCancel">Cancelar</button></div>
     </form></section>`:''}
${photoSec}
   <button class="btn pf-cal" id="fichaCrop" data-crop="${s.id}">${s.pot?'':'Ver calendario de '+(s.tree?'plantación':'siembra')+' de '+s.n.toLowerCase()}</button>`;
  if(s.pot)document.getElementById('fichaCrop').remove();
  const hU=document.getElementById('hU');if(hU)enhanceSelect(hU);
  if(state.editing){document.getElementById('eSp').value=p.sp;document.getElementById('eLoc').value=p.loc;enhanceSelect(document.getElementById('eSp'));enhanceSelect(document.getElementById('eLoc'));const n=document.getElementById('eName');n.focus();n.select()}
}
// Ficha de planta (móvil y, a dos columnas, ordenador): cabecera con foto, datos, cuidados, fotos, cosechas y compañeras plegadas, y Quitar con confirmación
function renderPlantFichaM(p,s,age,photoSec){
  const d=dues(p),when=l=>l<0?`Hace ${-l} ${-l===1?'día':'días'}`:l===0?'Toca hoy':leftTxt(l);
  const BTN={riego:'Regada hoy',abono:'Abonada hoy',sustrato:'Sustrato cambiado',poda:'Podada hoy'};
  const tot=harvTot(p.harv,YEAR),hs=harvSec(p),cs=compSec(p),have=[...REL[p.sp].good].filter(id=>mine(id).length).length;
  const fold=(id,t,sum,body)=>body?`<details class="pf-fold" data-fold="${id}"${state.pfOpen?.[id]?' open':''}><summary>${t}<small>${sum}</small><svg class="tch" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary>${body}</details>`:'';
  document.getElementById('fichaIn').innerHTML=`
   <div class="pf-hd m">${plantThumb(p)}<div class="pf-id"><h2 id="fichaTitle">${esc(p.name)}</h2><small>${s.n} · ${GROUPS[s.g]}</small></div>
     <button class="x" id="fichaClose" aria-label="Cerrar ficha">×</button></div>
   <div class="pf-cols"><div class="pf-l">
   <div class="tstats" style="--n:3"><div><span>Ubicación</span><b>${p.loc==='interior'?'Interior':'Exterior'}</b></div><div><span>${s.tree?'Plantación':'Siembra'}</span><b>${parse(p.sown).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</b></div><div><span>Edad</span><b>${age}</b></div></div>
   ${d.length?`<section class="pf-sec pcare-s"><div class="pf-sh"><h3>Cuidados</h3></div><div class="pcare">${d.map(x=>{const c=x.left<0?'over':x.left===0?'today':'';
     return `<div class="pcr ${c}">${remIc(x.a)}<div><b>${ACTIONS[x.a]}</b><small>${ivTxt(x.iv).replace(/^c/,'C')} · <em>${when(x.left).toLowerCase()}</em></small></div><button class="btn act" data-act="${x.a}" data-id="${esc(p.id)}">${BTN[x.a]}</button></div>`}).join('')}</div></section>`:''}
   ${fold('harv','Cosechas',tot?`${tot} en ${YEAR}`:(p.harv||[]).length?'Ver':'Anotar',hs)}
   ${fold('comp','Compañeras',have?`${have} ${have===1?'la tienes':'las tienes'}`:'Ver',cs)}
   ${s.pot?'':`<button class="btn pf-cal" id="fichaCrop" data-crop="${s.id}">Ver calendario de ${s.tree?'plantación':'siembra'} de ${s.n.toLowerCase()}</button>`}
   <div class="pf-bot"><button class="btn" id="sharePlantBtn">Compartir</button><button class="btn" id="editToggle" aria-expanded="false">Editar datos</button><button class="btn danger" id="plantDel">Quitar</button></div>
   </div><div class="pf-r">${photoSec}</div></div>`;
  document.getElementById('ficha').classList.add('pfw');
  const hU=document.getElementById('hU');if(hU)enhanceSelect(hU);
}
function openPlant(id){
  state.mode='plant';state.plantSel=id;state.harvEdit=null;state.photoBig=null;state.editing=false;state.photoEdit=false;renderPlantFicha();
  const f=document.getElementById('ficha');if(!f.open){try{f.showModal()}catch(e){f.setAttribute('open','')}}
  f.scrollTop=0;
}
function shrink(file){return new Promise((ok,ko)=>{const r=new FileReader();r.onerror=ko;r.onload=()=>{const im=new Image();im.onerror=ko;im.onload=()=>{
  const k=Math.min(1,900/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.75))};im.src=r.result};r.readAsDataURL(file)})}
function savePhotos(){try{store.setItem('hv.photos',JSON.stringify(photos));return true}catch(e){return false}}
const ficha=document.getElementById('ficha');
// Al tocar cualquier parte de un campo de fecha se abre el calendario (no solo el icono)
document.addEventListener('click',e=>{const d=e.target.closest('input[type=date]');if(d&&!d.disabled&&d.showPicker){try{d.showPicker()}catch(err){}}});
ficha.addEventListener('submit',e=>{
  if(e.target.id!=='editForm')return;e.preventDefault();
  const p=state.plants.find(x=>x.id===state.plantSel);const name=document.getElementById('eName').value.trim();if(!p||!name)return;
  p.name=name;p.sp=document.getElementById('eSp').value;p.loc=document.getElementById('eLoc').value;p.sown=document.getElementById('eDate').value||p.sown;
  save('hv.plants',state.plants);state.editing=false;renderPlantFicha();renderPlants();renderRem();toast('Cambios guardados');
});
ficha.addEventListener('change',async e=>{
  if(e.target.classList.contains('phDate')){
    // Solo cambia la foto seleccionada, y solo con una fecha completa y válida (al teclear el año el navegador manda fechas a medias)
    const v=e.target.value,p=state.plants.find(x=>x.id===state.plantSel),it=(photos[state.plantSel]||[]).find(x=>x.id===e.target.dataset.pid);
    if(!it||!p||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<p.sown||v>iso(today)||v===it.date)return;
    it.date=v;savePhotos();state.photoBig=it.id;renderPlantFicha();renderPlants();
    document.querySelector(`#ficha [data-photo="${esc(it.id)}"]`)?.scrollIntoView({block:'nearest',inline:'center'});
    toast(`Foto movida al día ${daysSince(p,v)}`);return}
  if(e.target.id!=='photoIn'||!e.target.files[0])return;
  const file=e.target.files[0],p=state.plants.find(x=>x.id===state.plantSel);
  try{
    const src=await shrink(file);
    let d=iso(new Date(Math.min(file.lastModified||Date.now(),Date.now())));if(d<p.sown)d=iso(today);
    const item={id:newId(),date:d,src};(photos[p.id]=photos[p.id]||[]).push(item);
    if(!savePhotos())toast('Foto añadida, pero no cabe más en este navegador para guardarla');else toast('Foto añadida al diario');
    state.photoBig=item.id;renderPlantFicha();renderPlants();
  }catch(err){toast('No se pudo leer la foto. Prueba con una imagen JPG o PNG.')}
});
ficha.addEventListener('close',()=>{state.editing=false;state.photoEdit=false});
ficha.addEventListener('focusout',e=>{if(!e.target.classList.contains('phDate'))return;const it=(photos[state.plantSel]||[]).find(x=>x.id===e.target.dataset.pid);if(it&&e.target.value!==it.date)e.target.value=it.date});
ficha.addEventListener('click',e=>{
  if(e.target===ficha||e.target.closest('#fichaClose')){ficha.close();return}
  if(e.target.closest('#photoEditToggle')){state.photoEdit=!state.photoEdit;renderPlantFicha();return}
  if(e.target.closest('#harvMore')){state.harvMore=state.harvMore===state.plantSel?null:state.plantSel;renderPlantFicha();return}
  const eh=e.target.closest('[data-edharv]');if(eh){state.harvEdit=eh.dataset.edharv;renderPlantFicha();const f=document.getElementById('harvForm');f?.scrollIntoView({block:'center'});document.getElementById('hQ')?.focus({preventScroll:true});return}
  if(e.target.closest('#harvCancel')){state.harvEdit=null;renderPlantFicha();return}
  const rh=e.target.closest('[data-rmharv]');if(rh){const p=state.plants.find(x=>x.id===state.plantSel);if(p){p.harv=(p.harv||[]).filter(h=>h.id!==rh.dataset.rmharv);save('hv.plants',state.plants);renderPlantFicha();renderPlants();toast('Cosecha borrada')}return}
  if(e.target.closest('#editToggle')){state.editing=!state.editing;renderPlantFicha();return}
  if(e.target.closest('#editCancel')){state.editing=false;renderPlantFicha();return}
  const th=e.target.closest('[data-photo]');if(th){state.photoBig=th.dataset.photo;renderPlantFicha();return}
  const rm=e.target.closest('[data-rmphoto]');if(rm){const l=photos[state.plantSel]||[];photos[state.plantSel]=l.filter(x=>x.id!==rm.dataset.rmphoto);savePhotos();state.photoBig=null;renderPlantFicha();renderPlants();toast('Foto borrada');return}
  const cp=e.target.closest('[data-cmp]');if(cp){openFicha(cp.dataset.cmp,true,state.plantSel);return}
  if(e.target.closest('#fichaBack')){openPlant(state.qFrom);return}
  const cr=e.target.closest('#fichaCrop');if(cr){document.getElementById('t-cal').click();openFicha(cr.dataset.crop);return}
  if(e.target.closest('#fichaTips')){state.tipSel=state.sel;ficha.close();document.getElementById('t-tip').click();window.scrollTo(0,0);return}
  if(e.target.closest('#fichaAdd')){
    // Se añade al momento con el nombre de la especie; la ficha se abre en edición para cambiarle el nombre
    const sp=SP[state.sel],n=state.plants.filter(p=>p.sp===sp.id).length,d=iso(today);
    const np={id:'p'+Date.now(),name:sp.n+(n?` ${n+1}`:''),sp:sp.id,loc:INDOOR.includes(sp.id)?'interior':'exterior',sown:d,log:{}};
    dropExamples();state.plants.push(np);save('hv.plants',state.plants);state.plGroup='todos';state.plLoc='todas';
    document.getElementById('t-pl').click();renderPlants();renderRem();
    openPlant(np.id);state.editing=true;renderPlantFicha();toast(`Añadido a tus plantas: ${np.name}`)}
});

// ---------- Cuidados ----------
function interval(p,act){
  const s=SP[p.sp];const base=s.care[act];if(!base)return 0;
  if(act!=='riego')return base;
  let f=1;
  if(p.loc==='exterior'){const t=zoneNow().t[curM];f=t>=25?.5:t>=20?.75:t<=12?1.5:1;if(hotNow(wx,iso(today)))f*=.7}
  else{f=[5,6,7,8].includes(curM)?.8:[10,11,0,1].includes(curM)?1.4:1}
  return Math.max(1,Math.round(base*f));
}
function dues(p){
  const out=[];
  for(const a of Object.keys(ACTIONS)){
    const iv=interval(p,a);if(!iv)continue;
    let last=p.log&&p.log[a]?parse(p.log[a]):parse(p.sown),rain=null,soon=null;
    // Fuera, la lluvia de verdad cuenta como riego; y si va a llover pronto se avisa de que se puede esperar
    if(a==='riego'&&p.loc==='exterior'&&wx){rain=rainSince(wx,iso(last),iso(today));if(rain)last=parse(rain.date)}
    const due=new Date(last.getTime()+iv*DAY),left=Math.round((due-today)/DAY);
    if(a==='riego'&&p.loc==='exterior'&&wx&&left<=1)soon=rainSoon(wx,iso(today));
    out.push({p,a,iv,last,due,left,rain,soon});
  }
  return out;
}
function leftTxt(l){return l<0?`Hace ${-l} ${-l===1?'día':'días'}`:l===0?'Hoy':l===1?'Mañana':`En ${l} días`}
function leftCls(l){return l<0?'over':l===0?'today':'ok'}

function renderPlants(){planUI?.draw();renderPlantsList()}
// Tarjetas compactas con la próxima tarea, buscador y orden (móvil y ordenador)
const ILU_SP=['tomate','pimiento','zanahoria','col','rabano','monstera','sandia'];
function plantThumb(p){
  const ph=(photos[p.id]||[]).slice().sort((a,b)=>a.date<b.date?-1:1).pop();
  return ph?`<span class="pth"><img src="${img(ph.src)}" alt=""></span>`:ILU_SP.includes(p.sp)?`<span class="pth ilu"><img src="${ILUS+p.sp}.webp" alt=""></span>`:`<span class="pth none" aria-hidden="true">${esc(SP[p.sp].n[0])}</span>`;
}
const nextDue=p=>dues(p).sort((a,b)=>a.left-b.left)[0];
function renderPlantsMobile(){
  document.getElementById('plmEj').hidden=!state.plants.some(p=>p.ej);
  const q=cselNorm(document.getElementById('plmQ').value.trim()),sort=state.plSort||'care';
  // Ubicación y tipo solo se filtran en el ordenador (en el móvil no se ven esos desplegables)
  const fl=!MOBILE.matches,list=state.plants.filter(p=>(!q||cselNorm(p.name).includes(q)||cselNorm(SP[p.sp].n).includes(q))&&(!fl||state.plLoc==='todas'||p.loc===state.plLoc)&&(!fl||state.plGroup==='todos'||SP[p.sp].g===state.plGroup));
  const key={care:p=>nextDue(p)?.left??999,name:p=>0,new:p=>-parse(p.sown)};
  list.sort((a,b)=>key[sort](a)-key[sort](b)||a.name.localeCompare(b.name,'es'));
  const when=l=>l<0?`hace ${-l} ${-l===1?'día':'días'}`:l===0?'hoy':leftTxt(l).toLowerCase();
  const row=p=>{const d=nextDue(p),c=d?(d.left<0?'over':d.left===0?'today':'fine'):'fine';
    return `<div class="prow" data-open="${esc(p.id)}" role="button" tabindex="0" aria-label="Abrir ficha de ${esc(p.name)}">${plantThumb(p)}
      <div class="pt"><b>${esc(p.name)}</b><small>${SP[p.sp].n} · ${p.loc}</small>${d?`<span class="nx ${c}">${VERB[d.a]} · ${when(d.left)}</span>`:''}</div>
</div>`};
  let h='';
  for(const g of Object.keys(GROUPS)){const ps=list.filter(p=>SP[p.sp].g===g);if(!ps.length)continue;
    h+=`<h3 class="pgh">${GROUPS[g]} <span class="n">${ps.length}</span></h3><div class="plist">${ps.map(row).join('')}</div>`}
  renderHarvests();
  document.getElementById('plList').innerHTML=h||`<p class="lede" style="text-align:center;margin-inline:auto">${q?'No hay plantas con ese nombre.':'Aún no tienes plantas. Añade la primera con el botón +.'}</p>`;
}
function renderPlantsList(){
  const groups=['todos',...Object.keys(GROUPS)];
  document.getElementById('plGroups').innerHTML=Object.keys(GROUPS).map(g=>`<button class="chip" data-g="${g}" aria-pressed="${state.plGroup===g}">${GROUPS[g]}</button>`).join('');
  // "Todas" = sin filtro de ubicación ni de tipo
  const all=state.plLoc==='todas'&&state.plGroup==='todos';
  document.querySelectorAll('#locSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.loc==='todas'?all:b.dataset.loc===state.plLoc));
  for(const[id,v]of[['plLocSel',state.plLoc],['plGroupSel',state.plGroup]]){const el=document.getElementById(id);if(el&&el.value!==v){el.value=v;el._cselDraw&&el._cselDraw()}}
  renderPlantsMobile();
}
function careChanged(){save('hv.plants',state.plants);renderPlants();renderRem();if(ficha.open&&state.mode==='plant')renderPlantFicha()}
// Deshacer una tarea marcada hoy: vuelve la fecha que tenía antes
function undoCare(p,k){if(!p||p.log?.[k]!==iso(today))return;
  // Si no se guardó la fecha anterior (marcada antes de existir «Deshacer» o en otro dispositivo), vuelve a tocar hoy
  const prev=p.logPrev&&k in p.logPrev?p.logPrev[k]:iso(new Date(today.getTime()-interval(p,k)*DAY));
  if(prev)p.log[k]=prev;else delete p.log[k];if(p.logPrev){delete p.logPrev[k];if(!Object.keys(p.logPrev).length)delete p.logPrev}
  careChanged();toast(`${ACTIONS[k]} deshecho: ${p.name}`)}
// Iconos de cada tarea en Avisos
const REM_IC={riego:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',abono:'<path d="M6 8h12l-1 12H7z"/><path d="M9 8V5h6v3"/>',sustrato:'<path d="M5 10h14l-2 10H7z"/><path d="M4 10h16"/><path d="M12 10V6m0 0c0-2 2-3 4-3 0 2-2 3-4 3zm0 0c0-2-2-3-4-3 0 2 2 3 4 3"/>',poda:'<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 8.5L20 17M8 15.5L20 7"/>',semilla:'<path d="M12 21c0-6 0-9 0-11"/><path d="M12 12c-4 0-7-3-7-7 4 0 7 3 7 7zm0-2c0-3 2-6 6-6 0 4-3 6-6 6"/>'};
const remIc=k=>`<span class="ric"><svg viewBox="0 0 24 24" aria-hidden="true">${REM_IC[k]}</svg></span>`;
const REM_OK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
function renderRem(){
  const all=state.plants.flatMap(dues).filter(x=>x.left<=7).sort((a,b)=>a.left-b.left);
  const done=state.plants.flatMap(p=>Object.keys(ACTIONS).filter(a=>p.log&&p.log[a]===iso(today)).map(a=>({p,a})));
  const over=all.filter(x=>x.left<0).length,tod=all.filter(x=>x.left===0).length;
  const b=document.getElementById('remCount');b.hidden=!(over+tod);b.textContent=over+tod;
  document.getElementById('remN').textContent=over+tod?`${over+tod} ${over+tod===1?'pendiente':'pendientes'}`:'';
  const cls=l=>l<0?'over':l===0?'today':'soon';
  const when=l=>l<0?`<em>hace ${-l} ${-l===1?'día':'días'}</em>`:l===0?'<em>toca hoy</em>':leftTxt(l).toLowerCase();
  // Máximo REM_MAX entradas por grupo; el resto detrás de «Ver más»
  const more=state.remMore||(state.remMore={}),REM_MAX=3;
  const lim=(k,rows)=>rows.length<=REM_MAX?rows.join(''):(more[k]?rows:rows.slice(0,REM_MAX)).join('')+`<button class="rmore" data-remmore="${k}" aria-expanded="${!!more[k]}">${more[k]?'Ver menos':`Ver ${rows.length-REM_MAX} más`}</button>`;
  const row=x=>`<div class="rrow">${remIc(x.a)}
    <div class="rt"><b>${esc(x.p.name)}</b><span>${VERB[x.a]} · ${when(x.left)}${x.rain?` · <i class="wxsoon">llovió ${mm(x.rain.rain)}</i>`:x.soon?` · <i class="wxsoon">lluvia ${dayName(x.soon.date)}</i>`:''}</span></div>
    <button class="rok" data-act="${x.a}" data-id="${esc(x.p.id)}" aria-label="Hecho: ${VERB[x.a].toLowerCase()} ${esc(x.p.name)}">${REM_OK}</button></div>`;
  const grp=(k,t,rows)=>rows.length?`<section class="rgrp ${k}"><h3 class="rgh">${t} <span class="n">${rows.length}</span></h3><div class="rlist">${lim(k,rows)}</div></section>`:'';
  const by=k=>all.filter(x=>cls(x.left)===k).map(row);
  let h=grp('over','Atrasados',by('over'))+grp('today','Hoy',by('today'))+grp('soon','Próximos días',by('soon'))||'<p class="rempty">No hay tareas pendientes esta semana.</p>';
  const sow=seedRows().filter(r=>r.now);
  if(sow.length)h+=`<section class="rgrp seeds"><h3 class="rgh">Para sembrar este mes <span class="n">${sow.length}</span></h3><div class="rlist"><div class="rrow">${remIc('semilla')}<div class="rt"><b>${sow.map(r=>r.s.n).join(', ')}</b><span>De tus semillas</span></div><button class="btn" type="button" id="goSeeds">Ver</button></div></div></section>`;
  // Lo hecho hoy va aparte: en el ordenador, en la columna de la derecha bajo el tiempo
  document.getElementById('remDone').innerHTML=done.length?`<section class="rgrp done"><button class="rdone" data-remmore="done" aria-expanded="${!!more.done}">${REM_OK}${done.length} ${done.length===1?'hecho':'hechos'} hoy<span>${more.done?'Ocultar':'Ver'}</span></button>${more.done?`<div class="rlist">${done.map(x=>`<div class="rrow">${remIc(x.a)}<div class="rt"><b>${esc(x.p.name)}</b><span>${VERB[x.a]} · hecho</span></div>${`<button class="rundo" type="button" data-undo="${x.a}" data-id="${esc(x.p.id)}" aria-label="Deshacer: ${VERB[x.a].toLowerCase()} ${esc(x.p.name)}">Deshacer</button>`}</div>`).join('')}</div>`:''}</section>`:'';
  document.getElementById('remList').innerHTML=h;
  drawWx();
  // Próximas tareas para los avisos diarios
  updateSchedule(state.plants.flatMap(dues).map(x=>({date:iso(x.due),text:`${VERB[x.a]} ${x.p.name}`})));
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// Solo se pintan como imagen las fotos guardadas por la app (JPEG/PNG/WebP en base64)
function img(s){return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s||'')?s:''}
function renderAll(){renderCal();renderPlants();renderRem();renderTips();renderSeeds()}

// ---------- El tiempo ----------
const mm=n=>`${Math.round(n)} mm`,fday=d=>parse(d).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
function dayName(d){const t=iso(today),n=Math.round((parse(d)-today)/DAY);return d===t?'hoy':n===1?'mañana':`el ${parse(d).toLocaleDateString('es-ES',{weekday:'long'})}`}
const shortDay=d=>{const n=Math.round((parse(d)-today)/DAY);return n===0?'Hoy':n===1?'Mañ':parse(d).toLocaleDateString('es-ES',{weekday:'short'}).replace('.','')};
// Plantas de fuera que sufren con el frío: las de verano y los frutales tropicales
const tender=p=>p.loc==='exterior'&&(SP[p.sp].tMin>=12||SP[p.sp].frost>=8);
function wxPlace(){return state.cp?.name||ZONES[state.zone]?.name.split(' (')[0]||''}
async function wxCoords(){
  const c=state.cp;if(!c)return capital(state.zone);
  if(c.lat!=null)return [c.lat,c.lon];
  try{const d=await cpLoad();const m=d.m[c.i];if(m){setCp({...c,lat:m[1],lon:m[2]});return [m[1],m[2]]}}catch(e){}
  return capital(state.zone);
}
async function refreshWx(force){
  try{const ll=await wxCoords();if(!force&&isFresh(wx,ll))return;wx=await fetchWx(ll,state.alt);renderPlants();renderRem()}catch(e){}
}
function drawWx(){
  const el=document.getElementById('wx');if(!el)return;
  const t=iso(today),days=wx?wxNext(wx,t):[];
  if(!days.length){el.hidden=true;return}
  el.hidden=false;
  const alerts=[];
  const fr=coldest(wx,t);
  if(fr&&fr.min<=FROST_C){const ps=state.plants.filter(tender).map(p=>esc(p.name));
    alerts.push(['frost',`<strong>Riesgo de helada ${dayName(fr.date)}</strong> (mínima de ${Math.round(fr.min)}&nbsp;°C).`+(ps.length?` Protege por la noche ${ps.length>4?`${ps.slice(0,4).join(', ')} y ${ps.length-4} más`:ps.length>1?`${ps.slice(0,-1).join(', ')} y ${ps[ps.length-1]}`:ps[0]}: cúbrelas con manta térmica o mete las macetas dentro.`:' Las plantas de verano y los frutales tropicales lo pasan mal.')])}
  const hot=hottest(wx,t);
  if(hot&&hot.max>=HEAT_C)alerts.push(['heat',`<strong>Calor fuerte ${dayName(hot.date)}</strong> (máxima de ${Math.round(hot.max)}&nbsp;°C). Riega a primera hora o al atardecer y vigila las macetas, que se secan antes. Los riegos de fuera se adelantan.`]);
  const wet=state.plants.filter(p=>p.loc==='exterior').flatMap(dues).filter(x=>x.rain);
  if(wet.length){const r=wet[0].rain;alerts.push(['rain',`<strong>Ha llovido ${mm(r.rain)} ${dayName(r.date)==='hoy'?'hoy':`el ${fday(r.date)}`}.</strong> Cuenta como riego: se retrasa el de ${wet.length===1?esc(wet[0].p.name):`${wet.length} plantas de fuera`}.`])}
  const old=Date.now()-wx.at>12*3600e3;
  el.innerHTML=`<div class="wxdays">${days.map(d=>{const[ic,tx]=sky(d.code);return `<div class="wxd${d.date===t?' now':''}" title="${tx}"><span class="wn" aria-label="${dayName(d.date)}">${shortDay(d.date)}</span><span class="wi" role="img" aria-label="${tx}">${ic}</span><span class="wt"><b>${Math.round(d.max)}°</b> <span class="wmin">${Math.round(d.min)}°</span></span><span class="wr">${d.rain>=1?mm(d.rain):''}</span></div>`}).join('')}</div>
    <p class="wxsrc">El tiempo en ${esc(wxPlace())}${old?`, de hace ${Math.round((Date.now()-wx.at)/3600e3)} h (sin conexión)`:''}<span>Datos: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo.com</a></span></p>
    ${alerts.map(([k,txt])=>`<p class="wxa ${k}">${txt}</p>`).join('')}`;
}
// ---------- Consejos ----------
const TIP_ROWS=[['s','Siembra'],['r','Riego'],['l','Luz'],['t','Suelo'],['a','Abonado'],['o','Poda'],['p','Plagas y problemas'],['c','Cosecha'],['b','Buenas compañeras'],['e','Mejor lejos de']];
// Secciones plegables de la ficha de consejos
const TIP_SECS=[['siembra','Siembra',['s'],'<path d="M12 21V11"/><path d="M12 13c-4 0-7-3-7-7 4 0 7 3 7 7zm0-2c0-3 2-6 6-6 0 4-3 6-6 6"/>'],
  ['cuidados','Cuidados',['r','l','t','a','o'],'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'],
  ['plagas','Plagas y problemas',['p'],'<circle cx="12" cy="13" r="5"/><path d="M12 8V5M9 6L7 4M15 6l2-2M7 13H4M20 13h-3"/>'],
  ['cosecha','Cosecha',['c'],'<path d="M5 10h14l-2 10H7z"/><path d="M9 10l3-5 3 5"/>'],
  ['comp','Compañeras y rotación',['b','e','rot'],'<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>']];
const TIP_LBL=Object.fromEntries(TIP_ROWS);
const shortIv=d=>ivTxt(d).replace(/^cada /,'').replace(/^año$/,'1 año');
function renderTips(){
  const mine=[...new Set(state.plants.map(p=>p.sp))].filter(id=>SP[id]);
  if(!state.tipSel||!SP[state.tipSel])state.tipSel=mine[0]||'tomate';
  const s=SP[state.tipSel],t=TIPS[s.id]||{},z=zoneNow(),open=state.tipOpen||(state.tipOpen={siembra:true});
  document.getElementById('tipMine').innerHTML=mine.map(id=>`<button class="chip" data-tip="${esc(id)}" aria-pressed="${id===s.id}">${SP[id].n}</button>`).join('');
  document.getElementById('tipMine').hidden=!mine.length;
  // Temporada: frase tranquila y barra de los 12 meses
  const st=s.pot?null:cellState(s,z,curM),sow=s.tree?'plantarlo':'sembrarla';
  const ms=s.pot||(s.tree&&!treeFits(s,z))?null:MONTHS.map((_,m)=>cellState(s,z,m));
  const nx=ms&&!st?[1,2,3,4,5,6,7,8,9,10,11].map(i=>(curM+i)%12).find(m=>ms[m]):null;
  const nxTxt=nx!=null?` Próxima ${s.tree?'plantación':'siembra'}: ${ms[nx]==='semillero'?'semillero en ':''}${MONTHS_L[nx]}.`:'';
  const now=s.pot?`Planta de maceta: se cuida todo el año.`
    :s.tree&&!treeFits(s,z)?`Tus inviernos son demasiado fríos para tenerlo fuera. ${st?`En ${MONTHS_L[curM]} es <b class="ok">buen momento</b> para plantarlo en maceta y resguardarlo en invierno.`:`En maceta resguardada, mejor plantarlo en ${ranges(potMonths(s,z)).toLowerCase().replace(/, ([^,]*)$/,' y $1')}.`}`
    :st==='directa'?`En ${MONTHS_L[curM]} <b class="ok">es buen momento</b> para ${s.tree?'plantarlo':'sembrarla directamente fuera'} en tu zona.`
    :st==='semillero'?`En ${MONTHS_L[curM]} <b class="ok">toca semillero</b> protegido en tu zona.`
    :(s.tree&&treeWhy(s,z))||`En ${MONTHS_L[curM]} <b>no toca ${sow}</b> en tu zona.${nxTxt}`;
  const bar=ms?`<div class="tmonths" role="img" aria-label="Meses de ${s.tree?'plantación':'siembra'} en tu zona">${MONTHS.map((l,m)=>`<i class="${ms[m]==='directa'?'d':ms[m]?'s':''}${m===curM?' cur':''}">${l[0]}</i>`).join('')}</div>
    <div class="tleg">${ms.includes('semillero')?'<span class="s">Semillero</span>':''}${ms.includes('directa')?`<span class="d">${s.tree?'Plantación':'Siembra directa'}</span>`:''}</div>`:'';
  const ilu=['tomate','pimiento','zanahoria','col','rabano','monstera','sandia'].includes(s.id)?ILUS+s.id+'.webp':'';
  const care=Object.keys(ACTIONS).filter(a=>s.care&&s.care[a]);
  const rot=rotNext(s.id),rotTxt=rot?`Es ${ROT[rot.f].n}. Cuando la quites, siembra en ese sitio ${ROT[rot.f].why}${rot.now.length?`: ahora en tu zona, ${rot.now.map(id=>SP[id].n.toLowerCase()).join(', ')}`:''}.`:'';
  const val=k=>k==='rot'?rotTxt:t[k]&&t[k]!=='—'?t[k]:'';
  const lbl=k=>k==='rot'?'Rotación':k==='s'&&s.tree?'Plantación':TIP_LBL[k];
  const secs=TIP_SECS.map(([id,ti,ks,ic])=>{const its=ks.filter(val);if(!its.length)return '';
    const one=its.length===1&&ks.length===1;
    return `<details class="tsec" data-tsec="${id}"${open[id]?' open':''}><summary><span class="tic"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg></span><span class="tst">${id==='siembra'&&s.tree?'Plantación':ti}</span>${its.length>1?`<small>${its.map(k=>lbl(k)).join(', ').toLowerCase().replace(/^./,c=>c.toUpperCase())}</small>`:''}<svg class="tch" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary>
      <div class="tsb">${its.map(k=>`<div>${one?'':`<em>${lbl(k)}</em>`}<p>${val(k)}</p></div>`).join('')}</div></details>`}).join('');
  document.getElementById('tipBody').innerHTML=`
    <div class="thero"><div class="ttop${ilu?'':' noimg'}">${ilu?`<img src="${ilu}" alt="">`:''}<div><h2>${s.n}</h2><small>${GROUPS[s.g]}${mine.includes(s.id)?' · en tu huerto':''}</small></div></div>
      ${care.length?`<div class="tstats" style="--n:${care.length}">${care.map(a=>`<div><span>${ACTIONS[a]}</span><b>${shortIv(s.care[a])}</b></div>`).join('')}</div>`:''}</div>
    ${t.k?`<div class="tkey"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg><div><b>Consejo clave</b>${t.k}</div></div>`:''}
    <div class="tseason"><p>${now}</p>${bar}${s.tree&&lowChill(s,z)?`<p class="tchill">${chillTxt(s)}</p>`:''}</div>
    <div class="tacc">${secs}</div>`;
}
// Buscador de Consejos
const tipQ=document.getElementById('tipQ'),tipRes=document.getElementById('tipRes');
tipQ.placeholder=`Buscar entre ${SPECIES.length} plantas…`;
let tipAct=0;
function tipFind(){
  const k=cselNorm(tipQ.value.trim());
  if(!k){tipRes.hidden=true;tipQ.setAttribute('aria-expanded','false');return}
  const hits=SPECIES.filter(s=>{const n=cselNorm(s.n);return n.startsWith(k)||n.split(/[\s(]+/).some(w=>w.startsWith(k))}).slice(0,8);
  if(tipAct>=hits.length)tipAct=0;
  tipRes.innerHTML=hits.length?hits.map((s,i)=>`<li role="option" id="tr-${s.id}" data-tip="${s.id}" aria-selected="${i===tipAct}" class="${i===tipAct?'act':''}">${s.n}<small>${GROUPS[s.g]}</small></li>`).join(''):'<li class="none">Sin resultados</li>';
  tipRes.hidden=false;tipQ.setAttribute('aria-expanded','true');
}
function tipPick(id){state.tipSel=id;tipQ.value='';tipRes.hidden=true;tipQ.setAttribute('aria-expanded','false');tipQ.blur();renderTips();document.getElementById('tipBody').scrollIntoView({block:'nearest'})}

let tt,tDone;function toast(msg,act,fn,ms){const t=document.getElementById('toast');tDone?.();tDone=null;t.textContent=msg;t.classList.toggle('act',!!act);
  if(act){const b=document.createElement('button');b.type='button';b.textContent=act;b.onclick=()=>{clearTimeout(tt);t.hidden=true;tDone=null;fn()};t.append(b)}
  t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{t.hidden=true;tDone?.();tDone=null},ms||2200)}

// ---------- Eventos ----------
const zBtn=document.getElementById('zone'),zList=document.getElementById('zoneList'),zKeys=Object.keys(ZONES);
let zAct=0;
function drawZones(){
  document.getElementById('zoneTxt').textContent=zoneNow().name;
  let reg='';zList.innerHTML=zKeys.map((k,i)=>{const z=ZONES[k],h=z.reg!==reg?`<li role="presentation" class="zreg">${z.reg}</li>`:'';reg=z.reg;
    return h+`<li role="option" id="zo-${k}" data-z="${k}" aria-selected="${k===state.zone}" class="${i===zAct?'act':''}">${z.name}</li>`}).join('');
  zList.setAttribute('aria-activedescendant','zo-'+zKeys[zAct]);
  if(!zList.hidden)document.getElementById('zo-'+zKeys[zAct])?.scrollIntoView({block:'nearest'});
}
function openZones(){zAct=zKeys.indexOf(state.zone);zList.hidden=false;drawZones();zBtn.setAttribute('aria-expanded','true');zList.focus()}
function closeZones(f){zList.hidden=true;zBtn.setAttribute('aria-expanded','false');if(f)zBtn.focus()}
function pickZone(k){closeZones(true);if(k===state.zone)return;state.zone=k;save('hv.zone',k);state.alt=null;save('hv.alt',null);setCp(null);drawZones();drawAlt();renderAll();refreshWx(true);toast('Calendario actualizado para tu zona')}
// Altitud del huerto
const altIn=document.getElementById('alt');
function drawAlt(){const b=ZONES[state.zone];altIn.value=state.alt??'';altIn.placeholder=b.alt;document.getElementById('altHint').textContent=state.alt!=null&&state.alt!==b.alt?`Temperaturas ajustadas: ${state.alt>b.alt?'más frescas':'más templadas'} que en ${b.name.split(' (')[0]} capital (${b.alt} m).`:`Si lo dejas vacío se usa la altitud de ${b.name.split(' (')[0]} capital (${b.alt} m).`}
altIn.addEventListener('change',()=>{const v=altIn.value.trim();const n=v===''?null:Math.max(0,Math.min(3000,Math.round(+v)));state.alt=isNaN(n)?null:n;save('hv.alt',state.alt);drawAlt();drawZoneBox();renderAll()});
drawAlt();

// ---------- Código postal: municipio, provincia y altitud ----------
// Provincia según los dos primeros dígitos del código INE del municipio
const PROV_INE=[null,'alava','albacete','alicante','almeria','avila','badajoz','baleares','barcelona','burgos','caceres','cadiz','castellon','ciudadreal','cordoba','coruna','cuenca','girona','granada','guadalajara','gipuzkoa','huelva','huesca','jaen','leon','lleida','rioja','lugo','madrid','malaga','murcia','navarra','ourense','asturias','palencia','laspalmas','pontevedra','salamanca','tenerife','cantabria','segovia','sevilla','soria','tarragona','teruel','toledo','valencia','valladolid','bizkaia','zamora','zaragoza','ceuta','melilla'];
state.cp=load('hv.cp',null);
const cpIn=document.getElementById('cp'),cpOpts=document.getElementById('cpOpts'),cpHint=document.getElementById('cpHint');
let cpData=null;
async function cpLoad(){if(!cpData){const r=await fetch(import.meta.env.BASE_URL+'cp.json');if(!r.ok)throw new Error('cp');cpData=await r.json()}return cpData}
function setCp(v){state.cp=v;save('hv.cp',v);drawCp()}
let zoneOpen=false;
function drawZoneBox(){
  const c=state.cp,fold=!!c&&!zoneOpen;
  document.getElementById('zoneSum').hidden=!fold;document.getElementById('zoneFull').hidden=fold;
  document.getElementById('zoneDoneRow').hidden=!c||fold;
  const zt=c?`${c.name} (${ZONES[PROV_INE[c.prov]].name.split(' (')[0]})${state.alt!=null?` · ${state.alt} m`:''}`:'';
  if(c)document.getElementById('zoneSumTxt').textContent=zt;
  // Arriba del calendario, siempre a la vista: la zona y «Cambiar», o el aviso para ponerla
  const bar=document.getElementById('zoneBar');bar.hidden=!document.getElementById('zoneBox').closest('dialog');
  bar.classList.toggle('none',!c);
  bar.innerHTML=`<span class="zb-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span>`
    +(c?`<span class="zb-t"><small>Tu zona</small><b>${esc(c.name)}</b><small>${esc(ZONES[PROV_INE[c.prov]].name.split(' (')[0])}${state.alt!=null?` · ${state.alt} m de altitud`:''}</small></span><button class="btn" type="button" data-zopen>Cambiar</button>`
       :`<span class="zb-t"><b>Pon tu código postal</b><small>para ajustar el calendario a tu zona</small></span><button class="btn primary" type="button" data-zopen>Poner zona</button>`);
}
document.getElementById('zoneEdit').addEventListener('click',()=>{zoneOpen=true;drawZoneBox();cpIn.focus()});
document.getElementById('zoneDone').addEventListener('click',()=>{zoneOpen=false;drawZoneBox()});
function drawCp(){
  cpIn.value=state.cp?.cp||'';
  const c=state.cp;cpHint.hidden=!c;
  if(c)cpHint.textContent=`${c.name} (${ZONES[PROV_INE[c.prov]].name.split(' (')[0]})${c.alt!=null?` · ${c.alt} m de altitud`:''}`;
  const opts=c?.opts||[];cpOpts.hidden=opts.length<2;
  cpOpts.innerHTML=opts.length<2?'':opts.map(o=>`<button class="chip" type="button" data-cpm="${o.i}" aria-pressed="${o.i===c.i}">${esc(o.name)}</button>`).join('');
  drawZoneBox();
}
async function cpElevation(lat,lon){
  const r=await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`);
  if(!r.ok)throw new Error('elev');const j=await r.json();const e=j.elevation?.[0];
  if(typeof e!=='number'||isNaN(e))throw new Error('elev');return Math.max(0,Math.round(e));
}
async function cpApply(code,i){
  const d=await cpLoad();const [name,lat,lon,prov]=d.m[i];
  const opts=(d.c[code]||[]).map(k=>({i:k,name:d.m[k][0]}));
  let alt=null;try{alt=await cpElevation(lat,lon)}catch(e){}
  zoneOpen=opts.length>1&&!state.cp?.opts?.some(o=>o.i===i&&state.cp.cp===code);
  setCp({cp:code,i,name,prov,alt,opts,lat,lon});
  const z=PROV_INE[prov];if(z&&z!==state.zone){state.zone=z;save('hv.zone',z);drawZones()}
  state.alt=alt;save('hv.alt',alt);drawAlt();drawZoneBox();renderAll();refreshWx(true);
  toast(alt==null?`Calendario para ${name}. Sin conexión no se pudo consultar la altitud: se puede escribir a mano en Mi cuenta.`:`Calendario ajustado a ${name} (${alt} m)`);
}
cpIn.addEventListener('input',async()=>{
  const v=cpIn.value.replace(/\D/g,'').slice(0,5);if(v!==cpIn.value)cpIn.value=v;
  if(v.length<5){cpOpts.hidden=true;cpHint.hidden=true;return}
  if(state.cp?.cp===v)return drawCp();
  try{const d=await cpLoad();const ms=d.c[v];
    if(!ms){cpHint.hidden=false;cpHint.textContent='No encuentro ese código postal. Revisa los 5 números.';cpOpts.hidden=true;return}
    await cpApply(v,ms[0]);cpIn.blur();
  }catch(e){cpHint.hidden=false;cpHint.textContent='No se pudieron cargar los códigos postales. Inténtalo con conexión.'}
});
cpOpts.addEventListener('click',e=>{const b=e.target.closest('[data-cpm]');if(!b||!state.cp)return;zoneOpen=false;cpApply(state.cp.cp,+b.dataset.cpm).then(()=>{zoneOpen=false;drawZoneBox()})});
drawCp();
zBtn.addEventListener('click',()=>zList.hidden?openZones():closeZones());
zList.addEventListener('click',e=>{const li=e.target.closest('[data-z]');if(li)pickZone(li.dataset.z)});
zList.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();zAct=(zAct+(e.key==='ArrowDown'?1:zKeys.length-1))%zKeys.length;drawZones()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();pickZone(zKeys[zAct])}
  else if(e.key==='Escape'||e.key==='Tab'){closeZones(e.key==='Escape')}
  else if(e.key.length===1&&/\p{L}/u.test(e.key)){const n=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const i=zKeys.findIndex((k,j)=>j>zAct&&n(ZONES[k].name).startsWith(n(e.key)));const k=i>=0?i:zKeys.findIndex(k=>n(ZONES[k].name).startsWith(n(e.key)));if(k>=0){zAct=k;drawZones()}}
});
document.addEventListener('click',e=>{if(!zList.hidden&&!e.target.closest('.zsel'))closeZones()});
drawZones();
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('nav button').forEach(x=>x.setAttribute('aria-selected',x===b));
  document.querySelectorAll('.tabpanel').forEach(p=>p.hidden=p.id!=='p-'+b.dataset.tab);
  if(b.dataset.tab==='tip')renderTips();
  try{store.setItem('hv.tab',b.dataset.tab)}catch(e){}
  if(MOBILE.matches&&b.dataset.init!==undefined)window.scrollTo(0,0);b.dataset.init='';
}));
for(const id of ['remList','remDone'])document.getElementById(id).addEventListener('click',e=>{const m=e.target.closest('[data-remmore]');if(!m)return;const k=m.dataset.remmore;state.remMore[k]=!state.remMore[k];renderRem();if(!state.remMore[k])document.querySelector(`[data-remmore="${k}"]`)?.scrollIntoView({block:'nearest'})});
document.getElementById('calGroups').addEventListener('click',e=>{const g=e.target.closest('[data-g]');if(!g)return;state.calGroup=g.dataset.g;renderCal()});
// En el móvil los filtros del calendario van en un desplegable
const calGroupSel=document.getElementById('calGroupSel');
calGroupSel.innerHTML=`<option value="todos">Todos los cultivos</option>`+Object.entries(GROUPS).map(([g,l])=>`<option value="${g}">${l}</option>`).join('');
calGroupSel.addEventListener('change',()=>{state.calGroup=calGroupSel.value;renderCal()});
document.getElementById('cal').addEventListener('click',e=>{const r=e.target.closest('tr.crop');if(!r)return;openFicha(r.dataset.sp)});
document.getElementById('calNow').addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(b)openFicha(b.dataset.sp,true)});
for(const[id,d]of[['calPrev',11],['calNext',1]])document.getElementById(id).addEventListener('click',()=>{state.calM=((state.calM??curM)+d)%12;renderCal()});
document.getElementById('calQ').addEventListener('input',renderCal);
document.getElementById('calQm').addEventListener('input',renderCal);
document.getElementById('calSpan').addEventListener('click',e=>{const b=e.target.closest('[data-span]');if(!b)return;state.calSpan=b.dataset.span;save('hv.calspan',state.calSpan);renderCal()});
document.getElementById('calSeeds').addEventListener('click',()=>{state.calSeeds=!state.calSeeds;renderCal()});
MOBILE.addEventListener('change',renderCal);
const yearBtn=document.getElementById('yearBtn');
yearBtn.addEventListener('click',()=>{const on=document.getElementById('p-cal').classList.toggle('showyear');yearBtn.setAttribute('aria-expanded',on);yearBtn.textContent=on?'Ocultar el calendario del año':'Ver todo el año'});
document.getElementById('plGroups').addEventListener('click',e=>{const g=e.target.closest('[data-g]');if(!g)return;state.plGroup=state.plGroup===g.dataset.g?'todos':g.dataset.g;renderPlants()});
document.getElementById('locSeg').addEventListener('click',e=>{const b=e.target.closest('[data-loc]');if(!b)return;state.plLoc=b.dataset.loc;if(b.dataset.loc==='todas')state.plGroup='todos';renderPlants()});
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act]');
  const o=e.target.closest('[data-open]');if(o&&!a){openPlant(o.dataset.open);return}
  if(e.target.closest('#goSeeds')){document.getElementById('t-pl').click();const sb=document.getElementById('seedBox');sb.open=true;sb.scrollIntoView({block:'start',behavior:'smooth'});return}
  const rs=e.target.closest('[data-rmseed]');if(rs){const x=state.seeds.find(y=>y.id===rs.dataset.rmseed);state.seeds=state.seeds.filter(y=>y!==x);save('hv.seeds',state.seeds);renderSeeds();renderRem();renderCal();toast(`Semillas de ${SP[x.sp].n.toLowerCase()} quitadas`);return}
  const sw=e.target.closest('[data-sow]');if(sw){const x=state.seeds.find(y=>y.id===sw.dataset.sow),sp=SP[x.sp],n=state.plants.filter(p=>p.sp===sp.id).length;
    const np={id:'p'+Date.now(),name:sp.n+(n?` ${n+1}`:''),sp:sp.id,loc:INDOOR.includes(sp.id)?'interior':'exterior',sown:iso(today),log:{}};
    dropExamples();state.plants.push(np);save('hv.plants',state.plants);state.plGroup='todos';state.plLoc='todas';renderPlants();renderRem();
    openPlant(np.id);state.editing=true;renderPlantFicha();toast(`Sembrada: ${np.name}. Cámbiale el nombre si quieres.`);return}
  const hv=e.target.closest('[data-harvest]');if(hv){openPlant(hv.dataset.harvest);const sec=document.getElementById('harvSec');sec?.closest('details')?.setAttribute('open','');sec?.scrollIntoView({block:'start'});document.getElementById('hQ')?.focus({preventScroll:true});return}
  const un=e.target.closest('[data-undo]');if(un){undoCare(state.plants.find(x=>x.id===un.dataset.id),un.dataset.undo);return}
  if(a){const p=state.plants.find(x=>x.id===a.dataset.id),k=a.dataset.act;p.log=p.log||{};
    // Se guarda la fecha anterior para poder deshacerlo
    if(p.log[k]!==iso(today)){p.logPrev=p.logPrev||{};p.logPrev[k]=p.log[k]??null}
    p.log[k]=iso(today);careChanged();toast(`${ACTIONS[k]} anotado: ${p.name}`,'Deshacer',()=>undoCare(p,k),5000);return}
  const d=e.target.closest('[data-del]');
  if(d){const p=state.plants.find(x=>x.id===d.dataset.del);state.plants=state.plants.filter(x=>x!==p);save('hv.plants',state.plants);renderPlants();renderRem();toast(`${p.name} quitada`)}
});

// Desplegables propios con el mismo estilo que el de la zona (el nativo marca en azul)
let cselN=0;
const cselNorm=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
// Las listas largas (cultivos) llevan buscador: escribir acorta la lista a los nombres que empiezan así
function enhanceSelect(sel){
  if(!sel||sel.dataset.csel)return;sel.dataset.csel='1';
  const id='cs'+(++cselN),wrap=document.createElement('span');wrap.className='csel';
  sel.parentNode.insertBefore(wrap,sel);wrap.appendChild(sel);sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
  const btn=document.createElement('button');btn.type='button';btn.className='csel-btn';btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');
  const lab=sel.closest('label');if(lab){lab.removeAttribute('for');btn.setAttribute('aria-label',lab.firstChild.textContent.trim())}
  const pop=document.createElement('div');pop.className='csel-pop';pop.hidden=true;
  const ul=document.createElement('ul');ul.className='csel-list';ul.setAttribute('role','listbox');ul.tabIndex=-1;ul.id=id;
  const search=sel.options.length>12,q=search?document.createElement('input'):null;
  if(q){q.type='search';q.className='csel-q';q.placeholder='Buscar…';q.setAttribute('aria-label','Buscar');q.setAttribute('aria-controls',id);q.autocomplete='off';q.enterKeyHint='go';pop.append(q)}
  pop.append(ul);wrap.append(btn,pop);
  let act=0,vis=[];const opts=()=>[...sel.options];
  const match=(o,k)=>{if(!k)return true;const n=cselNorm(o.text);return n.startsWith(k)||n.split(/[\s(]+/).some(w=>w.startsWith(k))};
  const draw=()=>{const os=opts(),k=cselNorm(q?.value.trim());btn.disabled=sel.disabled;btn.innerHTML=`<span>${sel.selectedOptions[0]?.text||''}</span><span aria-hidden="true">▾</span>`;
    vis=os.map((o,i)=>i).filter(i=>match(os[i],k));if(!vis.includes(act))act=vis[0]??-1;
    let h='',last=null;vis.forEach(i=>{const o=os[i],g=o.parentNode.tagName==='OPTGROUP'?o.parentNode.label:null;if(g&&g!==last){h+=`<li class="grp" role="presentation">${g}</li>`;last=g}
      h+=`<li class="opt${i===act?' act':''}" role="option" id="${id}-${i}" data-i="${i}" aria-selected="${o.selected}">${esc(o.text)}</li>`});
    ul.innerHTML=h||'<li class="none" role="presentation">Sin resultados</li>';ul.setAttribute('aria-activedescendant',`${id}-${act}`);ul.querySelector('.act')?.scrollIntoView({block:'nearest'})};
  const open=first=>{act=sel.selectedIndex;if(q)q.value=first||'';pop.hidden=false;draw();btn.setAttribute('aria-expanded','true');(q||ul).focus()};
  const close=f=>{pop.hidden=true;btn.setAttribute('aria-expanded','false');if(f)btn.focus()};
  const pick=i=>{if(i<0)return;close(true);if(i!==sel.selectedIndex){sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}))}draw()};
  const keys=e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!vis.length)return;const j=vis.indexOf(act),n=vis.length;act=vis[(j+(e.key==='ArrowDown'?1:n-1))%n];draw()}
    else if(e.key==='Enter'||(e.key===' '&&e.target===ul)){e.preventDefault();pick(act)}
    else if(e.key==='Escape'||e.key==='Tab'){close(e.key==='Escape')}};
  btn.addEventListener('click',()=>pop.hidden?open():close());
  btn.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();open()}
    else if(q&&e.key.length===1&&!e.ctrlKey&&!e.metaKey&&e.key!==' '){e.preventDefault();open(e.key)}});
  ul.addEventListener('click',e=>{const li=e.target.closest('[data-i]');if(li)pick(+li.dataset.i)});
  ul.addEventListener('keydown',keys);
  if(q){q.addEventListener('input',()=>{act=-1;draw()});q.addEventListener('keydown',keys)}
  // e.target puede haberse sustituido al redibujar el botón: solo cuenta un clic de verdad fuera
  document.addEventListener('click',e=>{if(!pop.hidden&&e.target.isConnected&&!wrap.contains(e.target))close()});
  sel.addEventListener('change',draw);sel._cselDraw=draw;draw();
}
function refreshSelects(){document.querySelectorAll('select[data-csel]').forEach(s=>s._cselDraw&&s._cselDraw())}
const fSp=document.getElementById('fSp');
fSp.innerHTML=Object.entries(GROUPS).map(([g,l])=>`<optgroup label="${l}">${SPECIES.filter(s=>s.g===g).map(s=>`<option value="${s.id}">${s.n}</option>`).join('')}</optgroup>`).join('');
fSp.addEventListener('change',()=>{document.getElementById('fLoc').value=INDOOR.includes(fSp.value)?'interior':'exterior';refreshSelects()});
enhanceSelect(fSp);enhanceSelect(document.getElementById('fLoc'));enhanceSelect(calGroupSel);calGroupSel.parentNode.querySelector('.csel-btn').setAttribute('aria-label','Mostrar cultivos');
// Mis semillas: especie (sin árboles) y año de caducidad del sobre
const sSp=document.getElementById('sSp'),sCad=document.getElementById('sCad');
sSp.innerHTML=Object.entries(GROUPS).map(([g,l])=>{const o=SEEDABLE.filter(s=>s.g===g);return o.length?`<optgroup label="${l}">${o.map(s=>`<option value="${s.id}">${s.n}</option>`).join('')}</optgroup>`:''}).join('');
sCad.innerHTML='<option value="">No lo sé</option>'+Array.from({length:9},(_,i)=>today.getFullYear()-2+i).map(y=>`<option value="${y}">${y}</option>`).join('');
enhanceSelect(sSp);enhanceSelect(sCad);
document.getElementById('seedForm').addEventListener('submit',e=>{
  e.preventDefault();
  const x={id:'s'+Date.now(),sp:sSp.value,cad:sCad.value,note:document.getElementById('sNote').value.trim().slice(0,80)};
  state.seeds.push(x);save('hv.seeds',state.seeds);document.getElementById('sNote').value='';sCad.value='';refreshSelects();
  renderSeeds();renderRem();renderCal();toast(`Semillas de ${SP[x.sp].n.toLowerCase()} apuntadas`);
});
document.getElementById('seedList').addEventListener('click',e=>{const m=e.target.closest('[data-remmore]');if(!m)return;const k=m.dataset.remmore;state.remMore[k]=!state.remMore[k];renderSeeds()});
const plLocSel=document.getElementById('plLocSel'),plGroupSel=document.getElementById('plGroupSel');
plGroupSel.innerHTML=`<option value="todos">Todos los tipos</option>`+Object.entries(GROUPS).map(([g,l])=>`<option value="${g}">${l}</option>`).join('');
plLocSel.addEventListener('change',()=>{state.plLoc=plLocSel.value;renderPlants()});
plGroupSel.addEventListener('change',()=>{state.plGroup=plGroupSel.value;renderPlants()});
enhanceSelect(plLocSel);enhanceSelect(plGroupSel);
document.getElementById('tipMine').addEventListener('click',e=>{const b=e.target.closest('[data-tip]');if(!b)return;state.tipSel=b.dataset.tip;renderTips()});
// Recordar qué secciones están abiertas al cambiar de planta
document.getElementById('tipBody').addEventListener('toggle',e=>{const d=e.target.closest?.('[data-tsec]');if(d)state.tipOpen[d.dataset.tsec]=d.open},true);
tipQ.addEventListener('input',()=>{tipAct=0;tipFind()});
tipQ.addEventListener('keydown',e=>{const li=[...tipRes.querySelectorAll('[data-tip]')];
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!li.length)return;tipAct=(tipAct+(e.key==='ArrowDown'?1:li.length-1))%li.length;tipFind()}
  else if(e.key==='Enter'){e.preventDefault();if(li[tipAct])tipPick(li[tipAct].dataset.tip)}
  else if(e.key==='Escape'){tipQ.value='';tipFind()}});
tipRes.addEventListener('click',e=>{const li=e.target.closest('[data-tip]');if(li)tipPick(li.dataset.tip)});
document.addEventListener('click',e=>{if(!tipRes.hidden&&!e.target.closest('.tsearch'))tipRes.hidden=true});
renderTips();
document.getElementById('fDate').value=iso(today);
document.getElementById('addForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('fName').value.trim()||SP[fSp.value].n;
  const sown=document.getElementById('fDate').value||iso(today);
  const p={id:'p'+Date.now(),name,sp:fSp.value,loc:document.getElementById('fLoc').value,sown,log:{}};
  dropExamples();state.plants.push(p);save('hv.plants',state.plants);e.target.reset();document.getElementById('fDate').value=iso(today);refreshSelects();
  state.plGroup='todos';state.plLoc='todas';renderPlants();renderRem();toast(`${name} añadida`);document.getElementById("addBox").open=false
});
// ---------- Fotos del huerto ----------
// Cada huerto del plano tiene las suyas, guardadas con las fotos de las plantas bajo «huerto:<id del huerto>», y se sincronizan igual
function gpKey(){return 'huerto:'+(state.gpG?.id||load('hv.plan',null)?.list?.[0]?.id||'h1')}
// Las de antes, de un único huerto, pasan al primero
function gpMigrate(){const old=photos.huerto;if(!old)return;const k='huerto:'+(load('hv.plan',null)?.list?.[0]?.id||'h1');photos[k]=[...(photos[k]||[]),...old];delete photos.huerto;savePhotos()}
function gpMove(from,to){const a=photos['huerto:'+from];if(!a)return;photos['huerto:'+to]=[...(photos['huerto:'+to]||[]),...a];delete photos['huerto:'+from];savePhotos()}
function renderGPhotos(){
  const GP=gpKey(),gname=state.gpG?.name||'tu huerto';document.getElementById('gPhotoTitle').textContent=`Fotos de ${gname}`;{const sb=document.getElementById('gShare');if(!sb.disabled&&!sb._again)sb.textContent=`Compartir ${gname}`}
  const list=(photos[GP]||[]).slice().sort((a,b)=>a.date<b.date?1:-1),box=document.getElementById('gPhotoList');
  if(!list.length){box.innerHTML=`<p class="note">Haz fotos de ${esc(gname)} de vez en cuando y aquí verás cómo cambia a lo largo del año.</p>`;return}
  const big=list.find(x=>x.id===state.gpBig)||list[0],more=state.gpMore,thumbs=more?list:list.slice(0,6);
  box.innerHTML=`<figure class="gp-big"><img src="${img(big.src)}" alt="Foto de ${esc(gname)} del ${fdate(big.date)}"><figcaption>${fdate(big.date)}</figcaption>
    <button class="gp-edit" type="button" id="gpEdit" aria-label="Editar foto" aria-expanded="false" aria-controls="gpMenu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg></button>
    <div class="gp-menu" id="gpMenu" hidden><label class="gp-mi">Cambiar foto<input type="file" id="gpRep" accept="image/*"></label><button class="gp-mi del" type="button" id="gpDel">Borrar foto</button></div></figure>
    ${list.length>1?`<div class="gp-thumbs">${thumbs.map(x=>`<button type="button" class="gp-th${x===big?' on':''}" data-gp="${esc(x.id)}" aria-label="Foto del ${fdate(x.date)}"><img src="${img(x.src)}" alt=""><span>${fdate(x.date)}</span></button>`).join('')}</div>
    ${list.length>6?`<button class="btn remmore rm-soon" type="button" id="gpMore">${more?'Ver menos':`Ver ${list.length-6} más`}</button>`:''}`:''}`;
}
document.getElementById('gPhotoIn').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const src=await shrink(file),d=iso(new Date(Math.min(file.lastModified||Date.now(),Date.now())));
    const GP=gpKey(),item={id:newId(),date:d,src};(photos[GP]=photos[GP]||[]).push(item);state.gpBig=item.id;
    toast(savePhotos()?'Foto del huerto guardada':'Foto añadida, pero no cabe más en este navegador para guardarla');renderGPhotos();
  }catch(err){toast('No se pudo leer la foto. Prueba con una imagen JPG o PNG.')}
  e.target.value='';
});
document.getElementById('gPhotoList').addEventListener('click',e=>{
  const t=e.target.closest('[data-gp]');if(t){state.gpBig=t.dataset.gp;renderGPhotos();return}
  if(e.target.closest('#gpMore')){state.gpMore=!state.gpMore;renderGPhotos();return}
  const GP=gpKey(),list=(photos[GP]||[]).slice().sort((a,b)=>a.date<b.date?1:-1),big=list.find(x=>x.id===state.gpBig)||list[0];if(!big)return;
  const ed=e.target.closest('#gpEdit');if(ed){const m=document.getElementById('gpMenu');m.hidden=!m.hidden;ed.setAttribute('aria-expanded',!m.hidden);return}
  const b=e.target.closest('#gpDel');
  if(b){if(!b.dataset.sure){b.dataset.sure='1';b.textContent='¿Seguro? Toca otra vez';setTimeout(()=>{if(b.isConnected){delete b.dataset.sure;b.textContent='Borrar foto'}},4000);return}
    photos[GP]=(photos[GP]||[]).filter(x=>x!==big);state.gpBig=null;savePhotos();renderGPhotos();toast('Foto borrada');return}
});
// Compartir el huerto elegido: la foto que se está viendo (si hay) y su plano
document.getElementById('gShare').addEventListener('click',e=>{
  const g=planUI.current(),zone=state.cp?.name||ZONES[state.zone]?.name.split(' (')[0]||'';
  const list=(photos[gpKey()]||[]).slice().sort((a,b)=>a.date<b.date?1:-1),big=list.find(x=>x.id===state.gpBig)||list[0];
  const img=()=>shareGardenPlan({title:g.name,zone,n:g.n,plan:g,photo:big?{src:big.src,date:fdate(big.date)}:null});
  shareLink(e.currentTarget,'huerto',g.name,()=>({data:{name:g.name,zone,at:iso(today),plan:g},fotos:list.slice().reverse().map(x=>({src:x.src,date:x.date}))}),img);
});
// «Cambiar foto»: la foto que se está viendo se sustituye por otra, con la fecha de la nueva
document.getElementById('gPhotoList').addEventListener('change',async e=>{
  if(e.target.id!=='gpRep')return;const file=e.target.files[0];if(!file)return;
  const list=photos[gpKey()]||[],big=list.find(x=>x.id===state.gpBig)||list.slice().sort((a,b)=>a.date<b.date?1:-1)[0];if(!big)return;
  try{big.src=await shrink(file);big.date=iso(new Date(Math.min(file.lastModified||Date.now(),Date.now())));state.gpBig=big.id;
    toast(savePhotos()?'Foto cambiada':'Foto cambiada, pero no cabe más en este navegador para guardarla');renderGPhotos()}
  catch(err){toast('No se pudo leer la foto. Prueba con una imagen JPG o PNG.')}
});
gpMigrate();renderGPhotos();
// ---------- Mis plantas en el móvil: apartados Plantas · Plano · Cosechas · Semillas y botón «+» ----------
const plPanel=document.getElementById('p-pl'),plFab=document.getElementById('plFab');
const PL_FAB={plantas:'Añadir planta',plano:'Añadir huerto',cosechas:'Anotar cosecha',semillas:'Añadir semillas'};
function setPlSub(k){
  plPanel.dataset.sub=k;document.querySelectorAll('#plSub [data-sub]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.sub===k));
  document.getElementById('plFabTxt').textContent=PL_FAB[k];
  if(k==='plano')document.getElementById('planBox').open=true;if(k==='semillas')document.getElementById('seedBox').open=true;
  plPanel.classList.remove('adding');try{store.setItem('hv.plsub',k)}catch(e){}
}
document.getElementById('plSub').addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(b){setPlSub(b.dataset.sub);window.scrollTo(0,0)}});
plFab.addEventListener('click',()=>{const k=plPanel.dataset.sub;
  if(k==='plantas'){const a=document.getElementById('addBox');plPanel.classList.add('adding');a.open=true;window.scrollTo(0,0);setTimeout(()=>document.getElementById('fName').focus({preventScroll:true}),50)}
  else if(k==='plano')document.getElementById('planGAdd').click();
  else if(k==='cosechas')openHarvNew();
  else{plPanel.classList.add('adding');const f=document.getElementById('seedForm');window.scrollTo(0,0);setTimeout(()=>f.querySelector('.csel-btn')?.focus({preventScroll:true}),50)}
});
document.getElementById('addBox').addEventListener('toggle',e=>{if(!e.target.open)plPanel.classList.remove('adding')});
document.getElementById('seedForm').addEventListener('submit',()=>setTimeout(()=>{if(plPanel.dataset.sub==='semillas')plPanel.classList.remove('adding')},0));
try{setPlSub(store.getItem('hv.plsub')||'plantas')}catch(e){setPlSub('plantas')}
// ---------- Mis cosechas ----------
// Suma las cosechas anotadas en cada planta y las sueltas (de cultivos que ya no tienes o de años pasados), por años
let harvXInit=load('hv.harv',[]);
// Una fila de cosecha: al tocarla se abre su ficha; un icono si tiene fotos u observaciones
function harvRow(x,lbl,sub){const ph=(photos['cosecha:'+x.id]||[]).length;
  return `<button type="button" class="hrow" data-hopen="${esc(x.id)}"><span class="hl"><span>${lbl}</span>${sub?`<small>${sub}</small>`:''}</span><strong>${qtyTxt(x.q,x.u)}</strong><span class="hico">${ph?`<svg viewBox="0 0 24 24" aria-label="${ph} ${ph===1?'foto':'fotos'}"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8.5 6l1.5-2h4l1.5 2"/></svg>`:''}${x.o?'<svg viewBox="0 0 24 24" aria-label="Con observaciones"><path d="M5 4h14v16H5z"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/></svg>':''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span></button>`}
const qtyTxt=(q,u)=>`${num(q)} ${u==='ud'?(q===1?'unidad':'unidades'):u==='manojo'?(q===1?'manojo':'manojos'):u}`;
function renderHarvests(){
  if(!state.harvX)state.harvX=harvXInit;
  const all=[...state.plants.flatMap(p=>(p.harv||[]).map(x=>({...x,sp:p.sp}))),...state.harvX.filter(x=>SP[x.sp])];
  const years=[...new Set([YEAR,...all.map(x=>x.d.slice(0,4))])].sort().reverse();
  if(!years.includes(state.harvY))state.harvY=YEAR;
  const hy=document.getElementById('harvYear'),hyOpts=years.map(y=>`<option value="${y}"${y===state.harvY?' selected':''}>Cosecha ${y}</option>`).join('');
  if(hy.dataset.opts!==hyOpts){hy.dataset.opts=hyOpts;hy.innerHTML=hyOpts;hy.value=state.harvY;hy._cselDraw?.()}
  const Y=state.harvY;
  // Todas las cosechas del año, las de cada planta y las sueltas
  const rows=[...state.plants.flatMap(p=>(p.harv||[]).filter(x=>x.d.startsWith(Y)).map(x=>({...x,n:p.name||SP[p.sp]?.n||''}))),
    ...state.harvX.filter(x=>SP[x.sp]&&x.d.startsWith(Y)).map(x=>({...x,n:SP[x.sp].n}))].sort((a,b)=>a.d<b.d?1:-1);
  const more=state.harvXMore,shown=more?rows:rows.slice(0,6);
  // Una sola lista: cada cosecha del año elegido, de la más reciente a la más antigua
  document.getElementById('harvSum').innerHTML=(rows.length?'':`<p class="note">${Y===YEAR?'Anota lo que vas recogiendo con «Anotar cosecha» y aquí verás cada cosecha del año.':`No hay cosechas anotadas en ${Y}.`}</p>`)
    +(rows.length?`<ul class="harvl">${shown.map(x=>`<li>${harvRow(x,esc(x.n),fdate(x.d))}</li>`).join('')}</ul>`
      +(rows.length>6?`<button class="btn remmore rm-soon" type="button" id="harvXMore">${more?'Ver menos':`Ver ${rows.length-6} más`}</button>`:'')
      +`<div class="harvshare"><button class="btn" type="button" id="harvShare">Compartir las cosechas de ${Y}</button></div>`:'');
  state.harvRows=rows;
}
// Compartir todas las cosechas del año elegido: total por cultivo, cada cosecha y una foto de cada una (hasta 12)
document.getElementById('harvSum').addEventListener('click',e=>{const b=e.target.closest('#harvShare');if(!b)return;
  const Y=state.harvY,rows=state.harvRows||[];if(!rows.length)return;
  const by={};for(const x of rows){const k=SP[x.sp]?.n||x.n;(by[k]||(by[k]=[])).push(x)}
  const tot=Object.entries(by).map(([n,l])=>({n,t:harvTot(l)})).sort((a,b)=>by[b.n].length-by[a.n].length||a.n.localeCompare(b.n,'es'));
  const fotos=rows.map(x=>{const f=hfSort(photos['cosecha:'+x.id]||[])[0];return f?{src:f.src,date:f.date,n:x.n}:null}).filter(Boolean).slice(0,12).reverse();
  const first=rows[rows.length-1].d,last=rows[0].d,big=fotos[fotos.length-1];
  const img=()=>sharePlant({name:`Mis cosechas de ${Y}`,species:`${rows.length} ${rows.length===1?'cosecha':'cosechas'}`,loc:harvTot(rows)||'',
    sownTxt:`Del ${fdate(first)}`,ageTxt:`al ${fdate(last)}`,photo:big?{src:big.src,caption:big.n}:null,
    care:[tot.slice(0,4).map(x=>`${x.n} ${x.t}`).join(' · ')],deco:null});
  shareLink(b,'cosechas',`Cosechas de ${Y}`,()=>({data:{year:Y,at:iso(today),tot,
    list:rows.slice(0,200).map(x=>({n:x.n,species:SP[x.sp]?.n||'',qty:qtyTxt(x.q,x.u),d:x.d,o:(x.o||'').slice(0,300)}))},fotos}),img);
});
// Busca una cosecha por id, suelta o de una planta (p)
function findHarv(id){const x=state.harvX.find(y=>y.id===id);if(x)return{x};for(const p of state.plants){const h=(p.harv||[]).find(y=>y.id===id);if(h)return{x:h,p}}return{}}
const harvSpOpts=Object.entries(GROUPS).filter(([g])=>g!=='ornamental').map(([g,l])=>`<optgroup label="${l}">${SPECIES.filter(s=>s.g===g).map(s=>`<option value="${s.id}">${s.n}</option>`).join('')}</optgroup>`).join('');
document.getElementById('harvSum').addEventListener('click',e=>{if(e.target.closest('#harvXMore')){state.harvXMore=!state.harvXMore;renderHarvests()}});
// ---------- Ficha de cada cosecha ----------
// «Anotar cosecha» abre la ficha vacía con todo (cantidad, fecha, fotos y observaciones) y se guarda de una vez;
// al tocar una cosecha se ve su ficha y con «Editar» se cambia todo. Las fotos van en photos['cosecha:<id>'] y se sincronizan.
const harvDlg=document.getElementById('harvDlg'),harvIn=document.getElementById('harvIn');
let hf={id:null,pid:null,isNew:false,edit:false,ph:[],big:null};
const hfSort=l=>l.slice().sort((a,b)=>a.date<b.date?1:-1);
function showHarvDlg(){try{if(!harvDlg.open)harvDlg.showModal()}catch(e){harvDlg.setAttribute('open','')}harvDlg.scrollTop=0}
function openHarv(id){hf={id,pid:null,isNew:false,edit:false,ph:[],big:null};renderHarvFicha();showHarvDlg()}
function openHarvNew(pid){hf={id:null,pid:pid||null,isNew:true,edit:true,ph:[],big:null};renderHarvFicha();showHarvDlg()}
function harvChanged(p){if(p){save('hv.plants',state.plants);renderPlants();if(ficha.open&&state.mode==='plant')renderPlantFicha()}else save('hv.harv',state.harvX);renderHarvests()}
const pencil='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>';
function renderHarvFicha(){
  const f=hf.isNew?{}:findHarv(hf.id),x=f.x||{},p=hf.isNew?state.plants.find(y=>y.id===hf.pid):f.p;
  if(!hf.isNew&&!f.x){harvDlg.close();return}
  const sp=SP[p?p.sp:x.sp],name=p?p.name:sp?.n||'';
  let h=hf.isNew?`<div class="hd hf-newhd"><h2 id="hfTitle">Nueva cosecha</h2><button class="x" type="button" data-hclose aria-label="Cerrar">×</button></div>`
    :hf.edit?`<div class="hd"><h2 id="hfTitle">${esc(name)}</h2><button class="x" type="button" data-hclose aria-label="Cerrar">×</button></div>`
    :`<div class="hd hf-vhd"><div><h2 id="hfTitle">${esc(name)}</h2>${p&&sp?`<p class="hf-sp">${esc(sp.n)}</p>`:''}</div><button class="x" type="button" data-hclose aria-label="Cerrar">×</button></div>`;
  if(!hf.edit){
    const list=hfSort(photos['cosecha:'+hf.id]||[]),big=list.find(y=>y.id===hf.big)||list[0];
    // Los datos en dos columnas iguales: cantidad y fecha
    h+=`<dl class="hf-stats"><div><dt>Cantidad</dt><dd>${qtyTxt(x.q,x.u)}</dd></div><div><dt>Fecha</dt><dd>${fdate(x.d)}</dd></div></dl>
      ${big?`<figure class="gp-big"><img src="${img(big.src)}" alt="Foto de la cosecha de ${esc(name)}">${big.date!==x.d?`<figcaption>${fdate(big.date)}</figcaption>`:''}</figure>
        ${list.length>1?`<div class="gp-thumbs">${list.map(y=>`<button type="button" class="gp-th${y===big?' on':''}" data-hpbig="${esc(y.id)}" aria-label="Foto del ${fdate(y.date)}"><img src="${img(y.src)}" alt=""><span>${fdate(y.date)}</span></button>`).join('')}</div>`:''}`:''}
      <div class="hf-obs"><p class="k">Observaciones</p>${x.o?`<p>${esc(x.o).replace(/\n/g,'<br>')}</p>`:'<p class="note">Sin observaciones.</p>'}</div>
      <div class="hf-acts"><button class="btn" type="button" data-hshare>Compartir</button><button class="btn" type="button" data-hedit>${pencil}Editar</button></div>`;
  }else{
    const u=x.u||(p?.harv||[]).slice(-1)[0]?.u||'kg';
    const units=Object.entries(HARV_U).map(([k,v])=>`<option value="${k}"${k===u?' selected':''}>${v}</option>`).join('');
    h+=`<form class="hf-form" id="hfForm" novalidate>
      ${p?'':`<label class="pf">Cultivo<select id="hfSp">${harvSpOpts}</select></label>`}
      <div class="hf-row"><label class="pf">Cantidad<input id="hfQ" inputmode="decimal" autocomplete="off" placeholder="1,5" value="${x.q!=null?num(x.q):''}"></label><label class="pf">Unidad<select id="hfU">${units}</select></label></div>
      <label class="pf">Fecha<input id="hfD" type="date" max="${iso(today)}" value="${x.d||iso(today)}"></label>
      <div class="pf"><span>Fotos</span><div class="hf-phs">${hfSort(hf.ph).map(y=>`<span class="hf-ph"><img src="${img(y.src)}" alt="Foto del ${fdate(y.date)}"><button type="button" data-hprm="${esc(y.id)}" aria-label="Quitar esta foto">×</button></span>`).join('')}
        <label class="hf-phadd" aria-label="Añadir foto"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><input type="file" data-hpadd accept="image/*" multiple></label></div></div>
      <label class="pf">Observaciones<textarea id="hfO" rows="4" maxlength="1000" placeholder="Cómo salió, sabor, tamaño, plagas, qué cambiar el próximo año…">${esc(x.o||'')}</textarea></label>
      <p class="acmsg" id="hfMsg" hidden></p>
      <div class="hf-acts">${hf.isNew?'':'<button class="btn del" type="button" data-hdel>Borrar cosecha</button>'}<span class="sp"></span><button class="btn" type="button" data-hcancel>Cancelar</button><button class="btn primary">${hf.isNew?'Anotar':'Guardar'}</button></div></form>`;
  }
  harvIn.innerHTML=h;
  if(hf.edit){const sel=document.getElementById('hfSp');if(sel){sel.value=x.sp||state.hfLastSp||sel.options[0].value;enhanceSelect(sel)}enhanceSelect(document.getElementById('hfU'))}
}
// Lo escrito en el formulario se conserva al repintar (al añadir o quitar fotos)
function hfKeep(){const g=id=>document.getElementById(id)?.value;return {sp:g('hfSp'),q:g('hfQ'),u:g('hfU'),d:g('hfD'),o:g('hfO')}}
function hfRestore(v){for(const [id,k] of [['hfSp','sp'],['hfQ','q'],['hfU','u'],['hfD','d'],['hfO','o']]){const el=document.getElementById(id);if(el&&v[k]!=null)el.value=v[k]}refreshSelects()}
harvDlg.addEventListener('click',e=>{
  if(e.target===harvDlg||e.target.closest('[data-hclose]')){harvDlg.close();return}
  if(e.target.closest('[data-hedit]')){hf.edit=true;hf.ph=(photos['cosecha:'+hf.id]||[]).map(y=>({...y}));renderHarvFicha();return}
  if(e.target.closest('[data-hcancel]')){if(hf.isNew){harvDlg.close();return}hf.edit=false;renderHarvFicha();return}
  const t=e.target.closest('[data-hpbig]');if(t){hf.big=t.dataset.hpbig;renderHarvFicha();return}
  const pr=e.target.closest('[data-hprm]');if(pr){const v=hfKeep();hf.ph=hf.ph.filter(y=>y.id!==pr.dataset.hprm);renderHarvFicha();hfRestore(v);return}
  const hd=e.target.closest('[data-hdel]');
  if(hd){if(!hd.dataset.sure){hd.dataset.sure='1';hd.textContent='¿Seguro? Toca otra vez';setTimeout(()=>{if(hd.isConnected){delete hd.dataset.sure;hd.textContent='Borrar cosecha'}},4000);return}
    const {x,p}=findHarv(hf.id);if(!x)return;
    if(p)p.harv=p.harv.filter(y=>y.id!==x.id);else state.harvX=state.harvX.filter(y=>y.id!==x.id);
    if(photos['cosecha:'+x.id]){delete photos['cosecha:'+x.id];savePhotos()}harvDlg.close();harvChanged(p);toast('Cosecha borrada')}
});
// Compartir una cosecha: enlace de solo lectura con cantidad, fecha, fotos y observaciones (sin cuenta, una imagen)
harvDlg.addEventListener('click',e=>{const b=e.target.closest('[data-hshare]');if(!b)return;
  const f=findHarv(hf.id),x=f.x;if(!x)return;const p=f.p,sp=SP[p?p.sp:x.sp],name=p?p.name:sp?.n||'Cosecha';
  const ph=hfSort(photos['cosecha:'+x.id]||[]),big=ph.find(y=>y.id===hf.big)||ph[0];
  const img=()=>sharePlant({name,species:sp?.n||'',loc:'Cosecha',sownTxt:`Cosechado el ${fdate(x.d)}`,ageTxt:qtyTxt(x.q,x.u),
    photo:big?{src:big.src,caption:fdate(big.date)}:null,care:x.o?[x.o]:[],deco:sp?decoFor(sp.id):null});
  shareLink(b,'cosecha',name,()=>({data:{name,sp:sp?.id||'',species:sp?.n||'',qty:qtyTxt(x.q,x.u),d:x.d,o:x.o||'',at:iso(today),ilu:!!sp&&ILU_SP.includes(sp.id)},
    fotos:ph.map(y=>({src:y.src,date:y.date}))}),img);
});
harvDlg.addEventListener('change',async e=>{
  if(!e.target.matches('[data-hpadd]'))return;const files=[...e.target.files];if(!files.length)return;const v=hfKeep();
  for(const file of files){try{hf.ph.push({id:newId(),date:iso(new Date(Math.min(file.lastModified||Date.now(),Date.now()))),src:await shrink(file)})}catch(err){toast('No se pudo leer una foto. Prueba con una imagen JPG o PNG.')}}
  renderHarvFicha();hfRestore(v);
});
harvDlg.addEventListener('submit',e=>{e.preventDefault();
  const v=hfKeep(),q=parseFloat(String(v.q||'').replace(',','.')),msg=document.getElementById('hfMsg');
  if(!(q>0)){msg.textContent='Escribe cuánto has cosechado.';msg.hidden=false;document.getElementById('hfQ').focus();return}
  let x,p;
  if(hf.isNew){p=state.plants.find(y=>y.id===hf.pid);x={id:newId(),d:v.d||iso(today),q,u:v.u};if(p)p.harv=[...(p.harv||[]),x];else{x.sp=v.sp;state.harvX.push(x);state.hfLastSp=v.sp}hf.id=x.id}
  else{({x,p}=findHarv(hf.id));if(!x)return;Object.assign(x,{q,u:v.u,d:v.d||x.d});if(!p&&v.sp)x.sp=v.sp}
  const o=(v.o||'').trim();if(o)x.o=o;else delete x.o;
  if(hf.ph.length)photos['cosecha:'+x.id]=hf.ph;else delete photos['cosecha:'+x.id];
  const okPh=savePhotos();
  const wasNew=hf.isNew;state.harvY=x.d.slice(0,4);hf.isNew=false;hf.edit=false;hf.big=null;harvChanged(p);renderHarvFicha();harvDlg.scrollTop=0;
  toast(!okPh?'Cosecha guardada, pero las fotos no caben en este navegador':wasNew?`Cosecha anotada: ${qtyTxt(q,x.u)} de ${(p?p.name:SP[x.sp].n).toLowerCase()}`:'Cosecha guardada');
});
document.addEventListener('click',e=>{const o=e.target.closest('[data-hopen]');if(o){openHarv(o.dataset.hopen);return}
  const n=e.target.closest('[data-hnew]');if(n)openHarvNew(n.dataset.hnew)});
document.getElementById('harvNew').addEventListener('click',()=>openHarvNew());
const harvYear=document.getElementById('harvYear');enhanceSelect(harvYear);harvYear.addEventListener('change',()=>{state.harvY=harvYear.value;renderHarvests()});
var planUI=initPlan({overdue:p=>dues(p).filter(x=>x.left<0).map(x=>`${ACTIONS[x.a].toLowerCase()} (${leftTxt(x.left).toLowerCase()})`),plants:()=>state.plants,savePlants:()=>save('hv.plants',state.plants),SP,REL,esc,toast,enhance:enhanceSelect,openPlant:id=>openPlant(id),onGarden:g=>{if(state.gpG?.id!==g.id)state.gpBig=null;state.gpG=g;if(document.getElementById('gPhotoList')&&typeof photos!=='undefined')try{renderGPhotos()}catch(e){}},onRemoveGarden:(from,to)=>gpMove(from,to)});
renderAll();
// Apariencia: claro por defecto; la elección se recuerda en este navegador
function setTheme(t){document.documentElement.setAttribute('data-theme',t);document.querySelectorAll('[data-theme-set]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.themeSet===t))}
let savedTheme='light';try{savedTheme=store.getItem('hv.theme')||'light'}catch(e){}
setTheme(savedTheme);
// Claro/Oscuro: arriba en el ordenador y dentro de Mi cuenta en el móvil
document.addEventListener('click',e=>{const b=e.target.closest('[data-theme-set]');if(!b)return;setTheme(b.dataset.themeSet);try{store.setItem('hv.theme',b.dataset.themeSet)}catch(e){}});
try{const t=new URLSearchParams(location.search).get('tab')||store.getItem('hv.tab');if(t)document.querySelector(`nav [data-tab="${t}"]`)?.click()}catch(e){}

// ---------- Ilustraciones de fondo ----------
// Se colocan al azar en cada visita, sin solaparse, con giro de -70° a 70° (nunca boca abajo)
const DECO={monstera:{w:150,src:ILUS+'monstera.webp'},col:{w:112,src:ILUS+'col.webp'},sandia:{w:104,src:ILUS+'sandia.webp'},zanahoria:{w:96,src:ILUS+'zanahoria.webp'},pimiento:{w:84,src:ILUS+'pimiento.webp'},rabano:{w:78,src:ILUS+'rabano.webp'},tomate:{w:74,src:ILUS+'tomate.webp'}};
function decoUrl(nm){return DECO[nm].src}
function layoutDeco(){
  let box=document.getElementById('deco');if(!box){box=document.createElement('div');box.id='deco';box.setAttribute('aria-hidden','true');document.body.prepend(box)}
  const W=innerWidth,H=innerHeight,k=Math.max(.65,Math.min(1,W/1200)),cell=163*k,dy=cell*.9;
  const names=['monstera','tomate','zanahoria','col','rabano','sandia','pimiento'];
  const ROT=[-30,25,-55,10,50,-15,35,-45,60,-5,40,-65,20,-35];
  const cols=Math.ceil(W/cell)+1,rows=Math.ceil(H/dy)+1;let h='',i=0;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++,i++){
    const nm=names[(c+r*3)%names.length],w=DECO[nm].w*k*.9;
    const x=c*cell+(r%2?cell/2:0)-cell/4,y=r*dy-dy/4;
    const rot=ROT[(c*5+r*3)%ROT.length],flip=(c+r)%2?-1:1;
    h+=`<img src="${decoUrl(nm)}" alt="" style="width:${w.toFixed(0)}px;left:${(x-w/2).toFixed(0)}px;top:${(y-w/2).toFixed(0)}px;transform:rotate(${rot}deg) scaleX(${flip})">`;
  }
  box.innerHTML=h;
}
layoutDeco();
let decoW=innerWidth,decoT;addEventListener('resize',()=>{clearTimeout(decoT);decoT=setTimeout(()=>{if(Math.abs(innerWidth-decoW)>80){decoW=innerWidth;layoutDeco()}},300)});
function padHead(){const hd=document.querySelector('header');if(hd){document.body.style.paddingTop=hd.offsetHeight+'px';document.documentElement.style.scrollPaddingTop=hd.offsetHeight+12+'px'}}
padHead();try{new ResizeObserver(padHead).observe(document.querySelector('header'))}catch(e){addEventListener('resize',padHead)}
// ---------- Compartir como imagen ----------
const relTxt=d=>{const n=Math.round((today-parse(d))/DAY);return n<=0?'hoy':n===1?'ayer':`hace ${n} días`};
const decoFor=id=>DECO[id]?decoUrl(id):null;
const shareDone=r=>{if(r==='downloaded')toast('Imagen guardada en descargas');else if(r==='copied')toast('Enlace copiado: pégalo donde quieras');else if(r==='blocked')toast('No se pudo abrir el menú de compartir')};
async function shareBusy(btn,fn,err='No se pudo crear la imagen'){if(btn.disabled)return;
  // Imagen o enlace ya preparado esperando otro toque: se envía en este mismo toque
  if(btn._again){const go=btn._again;btn._again=null;btn.textContent=btn._label;btn.classList.remove('ready');go().then(shareDone);return}
  const t=btn.textContent;btn.disabled=true;btn.textContent='Preparando…';
  try{const r=await fn();
    if(r&&r.again){btn._again=r.again;btn._label=t;btn.disabled=false;btn.textContent='Toca para enviar';btn.classList.add('ready');
      setTimeout(()=>{if(btn._again===r.again){btn._again=null;btn.textContent=t;btn.classList.remove('ready')}},60000);return}
    shareDone(r)}catch(e){toast(navigator.onLine===false?'Sin conexión: el enlace se puede crear cuando vuelva internet':err)}
  btn.disabled=false;btn.textContent=t}
// Compartir con enlace de solo lectura (copia fija en la nube). Sin sesión se ofrece entrar o mandar la imagen de antes
function shareLink(btn,tipo,title,snap,imgFn){
  if(!cloudOn)return shareBusy(btn,imgFn);
  if(!currentUser()){confirmQ('Compartir con un enlace','Para compartir con un enlace hay que entrar en tu cuenta. También puedes mandar una imagen.',
    ()=>document.getElementById('acctBtn').click(),{yes:'Entrar',no:'Mandar imagen',onNo:()=>shareBusy(btn,imgFn)});return}
  shareBusy(btn,async()=>{const x=snap();const url=await createLink(tipo,title,x.data,x.fotos);return sendLink(url,title,`${title} · Sembradía`)},'No se pudo crear el enlace. Vuelve a intentarlo.');
}
// Quitar con confirmación y «Deshacer» (móvil)
const cfm=document.getElementById('cfmDlg');let cfmYes=null,cfmNo=null;
// o: {yes, no, onNo} para otros textos (sin «yes», es «Quitar» en rojo)
function confirmQ(t,txt,yes,o={}){document.getElementById('cfmT').textContent=t;document.getElementById('cfmP').textContent=txt;cfmYes=yes;cfmNo=o.onNo||null;
  const y=document.getElementById('cfmYes');y.textContent=o.yes||'Quitar';y.classList.toggle('danger',!o.yes);y.classList.toggle('primary',!!o.yes);
  document.getElementById('cfmNo').textContent=o.no||'Cancelar';try{cfm.showModal()}catch(e){cfm.setAttribute('open','')}}
document.getElementById('cfmNo').addEventListener('click',()=>{cfm.close();const f=cfmNo;cfmNo=null;f?.()});
document.getElementById('cfmYes').addEventListener('click',()=>{cfm.close();const f=cfmYes;cfmYes=null;f?.()});
cfm.addEventListener('click',e=>{if(e.target===cfm)cfm.close()});
function removePlant(p){
  const i=state.plants.indexOf(p);if(i<0)return;
  state.plants.splice(i,1);save('hv.plants',state.plants);if(ficha.open)ficha.close();renderPlants();renderRem();renderCal();
  toast(`${p.name} quitada`,'Deshacer',()=>{state.plants.splice(Math.min(i,state.plants.length),0,p);save('hv.plants',state.plants);renderPlants();renderRem();renderCal();toast(`${p.name} recuperada`)},6000);
  // Las fotos se borran cuando ya no se puede deshacer
  tDone=()=>{if(!state.plants.includes(p)){delete photos[p.id];savePhotos()}};
}
ficha.addEventListener('click',e=>{if(!e.target.closest('#plantDel'))return;const p=state.plants.find(x=>x.id===state.plantSel);if(!p)return;
  confirmQ(`¿Quitar «${p.name}»?`,'Se borran también sus fotos y cosechas.',()=>removePlant(p))});
ficha.addEventListener('toggle',e=>{const d=e.target.closest?.('[data-fold]');if(d)(state.pfOpen||(state.pfOpen={}))[d.dataset.fold]=d.open},true);
document.getElementById('plmQ').addEventListener('input',renderPlants);
const plmSort=document.getElementById('plmSort');enhanceSelect(plmSort);plmSort.addEventListener('change',()=>{state.plSort=plmSort.value;renderPlants()});
document.getElementById('plmEjX').addEventListener('click',()=>{if(dropExamples()){save('hv.plants',state.plants);renderPlants();renderRem();renderCal();toast('Plantas de ejemplo quitadas')}});
MOBILE.addEventListener('change',()=>{renderPlants();if(ficha.open&&state.mode==='plant')renderPlantFicha()});
// Fila de planta con teclado
document.getElementById('plList').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.prow')){e.preventDefault();openPlant(e.target.dataset.open)}});
ficha.addEventListener('click',e=>{const b=e.target.closest('#sharePlantBtn');if(!b)return;
  const p=state.plants.find(x=>x.id===state.plantSel);if(!p)return;const s=SP[p.sp];
  const ph=(photos[p.id]||[]).slice().sort((a,b)=>a.date<b.date?-1:1);const big=ph.find(x=>x.id===state.photoBig)||ph[ph.length-1];
  const age=daysSince(p,iso(today));
  const care=Object.keys(ACTIONS).filter(a=>s.care&&s.care[a]&&p.log&&p.log[a]).map(a=>`${ACTIONS[a]} ${relTxt(p.log[a])}`);
  const img=()=>sharePlant({name:p.name,species:s.n,loc:p.loc==='interior'?'Interior':'Exterior',
    sownTxt:`${s.tree?'Plantada':'Sembrada'} el ${fdate(p.sown)}`,ageTxt:age===0?'hoy':age===1?'1 día':`${age} días`,
    photo:big?{src:big.src,caption:`Día ${daysSince(p,big.date)}`}:null,care:care.length?[care.join(' · ')]:[],deco:decoFor(s.id)});
  shareLink(b,'planta',p.name,()=>({data:{name:p.name,sp:s.id,species:s.n,group:GROUPS[s.g],loc:p.loc,sown:p.sown,tree:!!s.tree,at:iso(today),
    care:dues(p).map(x=>({a:x.a,iv:x.iv,last:p.log?.[x.a]||null})),harv:harvTot(p.harv,YEAR)||'',ilu:ILU_SP.includes(s.id)},
    fotos:ph.map(x=>({src:x.src,date:x.date}))}),img);
});
setupNotify();
// Cuando llegan cambios de la nube (otro dispositivo) se recarga todo desde el almacén
function reloadFromStore(){
  photos=load('hv.photos',{});state.plants=load('hv.plants',[]);state.harvX=load('hv.harv',[]);gpMigrate();renderGPhotos();
  state.zone=(z=>OLD_ZONES[z]||(ZONES[z]?z:state.zone))(load('hv.zone',state.zone));state.alt=load('hv.alt',null);state.cp=load('hv.cp',null);state.seeds=load('hv.seeds',[]);
  drawZones();drawAlt();drawCp();drawZoneBox();planUI.reload();if(state.cp&&document.getElementById('zoneDlg').open&&!document.getElementById('zdCp').value)document.getElementById('zoneDlg').close();renderAll();refreshSelects();refreshWx();
  if(ficha.open&&state.mode==='plant'){if(state.plants.some(p=>p.id===state.plantSel))renderPlantFicha();else ficha.close()}
}
initAccount({refresh:reloadFromStore,toast});
// La zona y los avisos viven dentro de «Mi cuenta» (si la cuenta está disponible)
{const acct=document.getElementById('acctBtn'),homes=['zoneBox','avisos'].map(id=>{const el=document.getElementById(id);return [el,el.parentNode,el.nextSibling]});
 function placeSettings(){const inAcct=!acct.hidden;
  homes.forEach(([el,par,nx],i)=>{if(inAcct)document.getElementById(i?'acctAvisos':'acctZona').append(el);else par.insertBefore(el,nx)});
  drawZoneBox()}
 MOBILE.addEventListener('change',placeSettings);placeSettings();
 }
// ---------- Al abrir la app sin zona: se pide el código postal ----------
const zDlg=document.getElementById('zoneDlg'),zdCp=document.getElementById('zdCp'),zdOpts=document.getElementById('zdOpts'),zdRes=document.getElementById('zdRes'),zdOk=document.getElementById('zdOk');
function zdDraw(msg){const c=state.cp;zdOk.disabled=!c;
  zdRes.hidden=!(msg||c);zdRes.classList.toggle('err',!!msg);
  zdRes.textContent=msg||(c?`${c.name} (${ZONES[PROV_INE[c.prov]].name.split(' (')[0]})${c.alt!=null?` · ${c.alt} m de altitud`:''}`:'');
  const o=!msg&&c?.opts||[];zdOpts.hidden=o.length<2;
  zdOpts.innerHTML=o.length<2?'':o.map(x=>`<button class="chip" type="button" data-zdm="${x.i}" aria-pressed="${x.i===c.i}">${esc(x.name)}</button>`).join('')}
function openZoneDlg(){zdCp.value=state.cp?.cp||'';zdDraw();try{zDlg.showModal()}catch(e){zDlg.setAttribute('open','')}if(!state.cp)zdCp.focus()}
zdCp.addEventListener('input',async()=>{
  const v=zdCp.value.replace(/\D/g,'').slice(0,5);if(v!==zdCp.value)zdCp.value=v;
  if(v.length<5){zdRes.hidden=true;zdOpts.hidden=true;return}
  if(state.cp?.cp===v)return zdDraw();
  zdRes.hidden=false;zdRes.classList.remove('err');zdRes.textContent='Buscando…';
  try{const d=await cpLoad(),ms=d.c[v];if(!ms)return zdDraw('No se encuentra ese código postal. Revisa los 5 números.');
    await cpApply(v,ms[0]);zdDraw();zdCp.blur()}catch(e){zdDraw('No se pudieron cargar los códigos postales. Se puede intentar con conexión.')}
});
zdOpts.addEventListener('click',async e=>{const b=e.target.closest('[data-zdm]');if(!b||!state.cp)return;await cpApply(state.cp.cp,+b.dataset.zdm);zoneOpen=false;drawZoneBox();zdDraw()});
zdOk.addEventListener('click',()=>{zoneOpen=false;drawZoneBox();zDlg.close()});
document.getElementById('zdNo').addEventListener('click',()=>{try{sessionStorage.setItem('hv.zskip','1')}catch(e){}zDlg.close()});
document.getElementById('zoneBar').addEventListener('click',e=>{if(e.target.closest('[data-zopen]'))openZoneDlg()});
// Se pregunta en cada apertura mientras no haya zona (salvo «Ahora no» en esta sesión)
setTimeout(()=>{let skip=false;try{skip=!!sessionStorage.getItem('hv.zskip')}catch(e){}if(!state.cp&&!skip&&!document.querySelector('dialog[open]'))openZoneDlg()},600);
refreshWx();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshWx()});
