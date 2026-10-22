import React, { useState } from 'react';
import { Spot, StampRecord } from '../types';
import {
  Compass,
  MapPin,
  Route,
  Train,
  X,
  Bus,
  Car,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface ItineraryModalProps {
  spots: Spot[];
  stampRecords: Record<string, StampRecord>;
  onSelectSpot: (spot: Spot) => void;
  onClose: () => void;
}

interface CuratedRoute {
  id: string;
  title: string;
  days: string;
  theme: string;
  transport: string;
  description: string;
  dayPlans: Array<{
    day: number;
    title: string;
    spotNames: string[];
    travelTips: string;
  }>;
}

const PRESET_ROUTES: CuratedRoute[] = [
  {
    id: 'grand-loop',
    title: '經典福爾摩沙全島縱貫 7 日遊',
    days: '7 天 6 夜',
    theme: '環島壯遊 · 經典必訪',
    transport: '高鐵 + 臺鐵新自強號 + 台灣好行觀光公車',
    description: '從台北出發順時針或逆時針環島，串聯台北101、日月潭、阿里山、台南古都、高雄港灣、墾丁海岸與花蓮太魯閣世界級峽谷。',
    dayPlans: [
      {
        day: 1,
        title: '都會起點 · 台北當代與故宮風華',
        spotNames: ['台北 101 觀景台', '國立故宮博物院', '大稻埕與迪化街'],
        travelTips: '搭乘台北捷運信義線與淡水信義線，市區交通極為便捷。',
      },
      {
        day: 2,
        title: '山城秘境 · 九份茶香與北海岸地質',
        spotNames: ['九份老街', '野柳地質公園', '基隆廟口夜市'],
        travelTips: '於台北車站搭乘客運直達九份，午後順遊野柳欣賞女王頭。',
      },
      {
        day: 3,
        title: '中台灣水漾 · 日月潭湖光與向山清水模',
        spotNames: ['日月潭國家風景區', '清境農場與青青草原', '高美濕地與木棧道'],
        travelTips: '搭乘台灣好行日月潭線，建議租借環潭電輔單車漫騎向山段。',
      },
      {
        day: 4,
        title: '雲海森鐵 · 阿里山巨木林與奮起湖',
        spotNames: ['阿里山國家森林遊樂區', '南投竹山紫南宮'],
        travelTips: '自嘉義車站搭乘阿里山森鐵或台灣好行阿里山線登高避暑。',
      },
      {
        day: 5,
        title: '府城古都 · 安平赤崁古蹟與鹽田落日',
        spotNames: ['台南赤崁樓與全台首學孔廟', '台南安平古堡與安平老街', '台南花園夜市'],
        travelTips: '台南市區適合搭乘觀光公車或騎乘YouBike漫步歷史巷弄。',
      },
      {
        day: 6,
        title: '國境之南 · 港灣文創與南端天海',
        spotNames: ['高雄駁二藝術特區與大港橋', '墾丁白沙灣與鵝鑾鼻燈塔'],
        travelTips: '高鐵左營站轉乘墾丁快線直達恆春半島，沿途太平洋海風宜人。',
      },
      {
        day: 7,
        title: '大理石天工 · 東海岸壯麗太平洋與太魯閣',
        spotNames: ['太魯閣國家公園（天祥與燕子口）', '清水斷崖', '七星潭風景區'],
        travelTips: '搭乘新自強號EMU3000列車穿梭北迴鐵道，遠眺清水斷崖入海。',
      },
    ],
  },
  {
    id: 'rail-scenic',
    title: '山海鐵道慢活 5 日遊',
    days: '5 天 4 夜',
    theme: '減碳低碳 · 鐵道風光',
    transport: '臺鐵新自強號 / 普悠瑪 + 台灣好行',
    description: '利用台灣完善的環島鐵路網，車窗外隨時切換蔚藍太平洋與崇山峻嶺，享受慢步調的島嶼深呼吸。',
    dayPlans: [
      {
        day: 1,
        title: '蘭陽綠野 · 礁溪美人湯與傳統藝術',
        spotNames: ['礁溪溫泉與湯圍溝公園', '國立傳統藝術中心（宜蘭傳藝）', '頭城烏石港與外澳沙灘'],
        travelTips: '台北搭乘自強號僅需1小時抵達礁溪，享受足湯與小鎮美食。',
      },
      {
        day: 2,
        title: '太魯閣驚豔 · 花蓮大理石峽谷探秘',
        spotNames: ['太魯閣國家公園（天祥與燕子口）', '花蓮東大門國際觀光夜市'],
        travelTips: '花蓮車站前轉乘台灣好行太魯閣線，直達天祥與燕子口步道。',
      },
      {
        day: 3,
        title: '縱谷稻浪 · 池上伯朗金黃大道',
        spotNames: ['池上伯朗大道與金城武樹', '台東鹿野高台（熱氣球嘉年華）'],
        travelTips: '池上站出站步行5分鐘租借電動單車，馳騁於無電線桿純淨稻田。',
      },
      {
        day: 4,
        title: '最美車站 · 三仙台與多良南迴紅欄杆',
        spotNames: ['台東三仙台與跨海八拱橋', '台東太麻里金針山與多良車站'],
        travelTips: '搭乘南迴鐵路，享受全台最美臨海鐵道與太平洋浪花拍岸。',
      },
      {
        day: 5,
        title: '水岸新生 · 高雄港灣輕軌與大港橋',
        spotNames: ['高雄流行音樂中心與愛河灣', '高雄駁二藝術特區與大港橋'],
        travelTips: '搭乘高雄環狀輕軌，串聯亞洲新灣區各大現代藝術地標。',
      },
    ],
  },
  {
    id: 'islands-sea',
    title: '海角跳島與戰地藍眼淚 4 日遊',
    days: '4 天 3 夜',
    theme: '離島跳島 · 藍色公路',
    transport: '國內航班 + 快艇渡輪 + 租借電動機車',
    description: '造訪澎湖玄武岩海島、金門戰地洋樓文化與馬祖藍眼淚奇景，體驗跳島台灣的海洋風貌。',
    dayPlans: [
      {
        day: 1,
        title: '澎湖雙心 · 跨海大橋與摩西分海',
        spotNames: ['澎湖跨海大橋與通梁古榕', '澎湖奎壁山摩西分海', '澎湖七美雙心石滬'],
        travelTips: '注意每日潮汐時間，退潮時前往奎壁山踏浪分海。',
      },
      {
        day: 2,
        title: '金門風華 · 翟山坑道與得月樓洋樓',
        spotNames: ['金門翟山坑道', '金門莒光樓與水頭聚落得月樓', '金門模範街與邱良功母節孝坊'],
        travelTips: '租借電動機車巡遊金門紅磚古厝聚落，品嚐道地廣東粥。',
      },
      {
        day: 3,
        title: '馬祖地中海 · 芹壁石屋與北海坑道',
        spotNames: ['馬祖北竿芹壁聚落', '馬祖藍眼淚（南竿鐵堡與北海坑道）'],
        travelTips: '北海坑道夜間搖櫓船需提早預約，體驗撥水星河藍眼淚。',
      },
      {
        day: 4,
        title: '極北燈塔 · 國境之北純白古蹟',
        spotNames: ['馬祖東引燈塔（東湧燈塔）'],
        travelTips: '搭乘臺馬之星客輪巡航東海，登臨全台最北端純白英倫燈塔。',
      },
    ],
  },
];

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  spots,
  stampRecords,
  onSelectSpot,
  onClose,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('grand-loop');

  const activeRoute = PRESET_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_ROUTES[0];
  const spotsMap = new Map<string, Spot>();
  spots.forEach((s) => spotsMap.set(s.name, s));

  // Count collected spots in this route
  const collectedInRoute = activeRoute.dayPlans.reduce((acc, day) => {
    const dayCollected = day.spotNames.filter((name) => {
      const sp = spotsMap.get(name);
      return sp && !!stampRecords[sp.id];
    }).length;
    return acc + dayCollected;
  }, 0);

  const totalInRoute = activeRoute.dayPlans.reduce((acc, day) => acc + day.spotNames.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl h-[90vh] bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-indigo-900/40 flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-indigo-100">
                智慧環島行程規劃師
              </h2>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                整合大眾運具、節能減碳交通與已收集景點的慢活旅行指南
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Selector Tabs */}
        <div className="px-6 py-3 bg-stone-950/80 border-b border-stone-800 flex items-center gap-2 overflow-x-auto text-xs">
          {PRESET_ROUTES.map((route) => {
            const active = route.id === selectedRouteId;
            return (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/40'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <span>{route.title}</span>
                <span className="text-[10px] opacity-75 font-mono">({route.days})</span>
              </button>
            );
          })}
        </div>

        {/* Route Details and Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Banner */}
          <div className="bg-stone-800/80 p-5 rounded-xl border border-stone-700/60">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 bg-amber-950/70 border border-amber-700/50 px-2.5 py-0.5 rounded">
                  {activeRoute.theme}
                </span>
                <span className="text-xs text-stone-300 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>建議天數：{activeRoute.days}</span>
                </span>
              </div>

              <div className="text-xs text-stone-300">
                本路線已蓋章：
                <span className="text-amber-400 font-bold font-mono ml-1">
                  {collectedInRoute} / {totalInRoute}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-3">
              {activeRoute.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-indigo-200/90 bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-800/40">
              <Train className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>建議運具推薦：{activeRoute.transport}</span>
            </div>
          </div>

          {/* Day by Day Plan Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>每日行程安排與推薦串聯</span>
            </h3>

            <div className="space-y-4 border-l-2 border-indigo-700/50 pl-4 sm:pl-6 ml-2 sm:ml-4">
              {activeRoute.dayPlans.map((plan) => (
                <div key={plan.day} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-stone-900 group-hover:bg-amber-400 transition-colors" />

                  <div className="bg-stone-800/60 hover:bg-stone-800/90 p-4 rounded-xl border border-stone-700/50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                        DAY {plan.day}
                      </span>
                      <h4 className="text-sm font-semibold text-stone-100 flex-1 ml-2">
                        {plan.title}
                      </h4>
                    </div>

                    {/* Spot badges row */}
                    <div className="flex flex-wrap items-center gap-2 my-3">
                      {plan.spotNames.map((name, i) => {
                        const spotObj = spotsMap.get(name);
                        const isStamped = spotObj && !!stampRecords[spotObj.id];

                        return (
                          <div
                            key={i}
                            onClick={() => spotObj && onSelectSpot(spotObj)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-all ${
                              isStamped
                                ? 'bg-rose-950/40 border-rose-600 text-rose-200 hover:bg-rose-900/60'
                                : 'bg-stone-700/60 border-stone-600 text-stone-200 hover:bg-stone-600 hover:text-white'
                            }`}
                          >
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span className="font-medium">{name}</span>
                            {isStamped && (
                              <CheckCircle className="w-3 h-3 text-rose-400 ml-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-stone-400 italic">
                      交通指南：{plan.travelTips}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
