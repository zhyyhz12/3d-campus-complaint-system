/**
 * 校园建筑数据 - 青岛农业大学城阳校区（50栋建筑）
 * 数据来源于原 campus-3d-map.html，比例尺: 1unit ≈ 3m
 */
const BUILDINGS = [
  // ═══ 大门（边界）═══
  { id:'south_gate', name:'南门', x:74,z:90, w:4,h:6,d:2, color:0x8a7a6a },
  { id:'east_gate', name:'东门', x:190,z:18, w:4,h:9,d:12, color:0x8a7a6a },
  { id:'northeast_gate', name:'东北门', x:175,z:-90, w:4,h:9,d:10, color:0x8a7a6a },
  { id:'west_gate', name:'西门', x:-30,z:44, w:4,h:9,d:12, color:0x8a7a6a },

  // ═══ 广场/花园（平面）═══
  { id:'hongzi_square', name:'虹子广场', x:74,z:73, w:30,h:0.2,d:20, color:0xd4c4a8 },
  { id:'zhishi_square', name:'知音广场', x:120,z:72, w:16,h:0.2,d:12, color:0xc4b8a0 },
  { id:'dingsheng_garden', name:'鼎盛花园', x:22,z:75, w:14,h:0.2,d:10, color:0xa4c88a },

  // ═══ 中心区：主楼+图书馆+学术会馆 ═══
  { id:'main_building', name:'主楼', x:74,z:46, w:36,h:48,d:18, color:0xb0b0b0, type:'tower' },
  { id:'library', name:'图书馆', x:74,z:24, w:24,h:20,d:16, color:0x6a9fd4, type:'dome' },
  { id:'academic_hall', name:'学术会馆', x:42,z:28, w:16,h:6,d:10, color:0xc4b89a, type:'dome' },

  // ═══ 教学区东：A-G + 美术馆 ═══
  { id:'teach_a', name:'教学楼A', x:105,z:46, w:16,h:14,d:7, color:0xd4a76a, type:'teach' },
  { id:'teach_b', name:'教学楼B', x:130,z:44, w:16,h:14,d:7, color:0xc8a06a, type:'teach' },
  { id:'teach_c', name:'教学楼C', x:105,z:32, w:16,h:14,d:7, color:0xd4a76a, type:'teach' },
  { id:'teach_d', name:'教学楼D', x:130,z:30, w:16,h:14,d:7, color:0xc8a06a, type:'teach' },
  { id:'teach_e', name:'教学楼E', x:105,z:18, w:16,h:14,d:7, color:0xc8a06a, type:'teach' },
  { id:'teach_f', name:'教学楼F', x:130,z:16, w:16,h:14,d:7, color:0xbc9868, type:'teach' },
  { id:'teach_g', name:'教学楼G', x:155,z:22, w:16,h:14,d:7, color:0xbc9868, type:'teach' },
  { id:'art_museum', name:'美术馆', x:150,z:48, w:12,h:8,d:8, color:0xd47aaa, type:'museum' },

  // ═══ 教学区西 ═══
  { id:'science_bldg', name:'科技楼', x:18,z:4, w:18,h:18,d:14, color:0x7a9fd4, type:'office' },
  { id:'chem_bldg', name:'化学楼', x:0,z:-6, w:16,h:14,d:8, color:0x8a9fd4, type:'office' },
  { id:'bio_bldg', name:'生物楼', x:-18,z:4, w:16,h:14,d:8, color:0x8abf6a, type:'office' },
  { id:'eng_bldg', name:'工程楼', x:180,z:4, w:16,h:14,d:8, color:0x7a8fd4, type:'office' },
  { id:'econ_bldg', name:'文经楼', x:8,z:26, w:16,h:14,d:8, color:0xb8a8c0, type:'office' },
  { id:'info_bldg', name:'信息楼', x:-10,z:34, w:10,h:8,d:7, color:0x6a9fd4, type:'office' },

  // ═══ 湖泊/桥/亭/河（保持原位）═══
  { id:'hongzi_lake', name:'虹子湖', x:100,z:-16, w:38,h:0.2,d:48, color:0x4aa8d8 },
  { id:'yuxiu_bridge', name:'毓秀桥', x:100,z:-16, w:30,h:4,d:3, color:0x8a7a6a },
  { id:'yixin_pavilion', name:'怡心亭', x:85,z:-24, w:5,h:6,d:5, color:0x6a8a5a },
  { id:'hongzi_river', name:'虹子河', x:100,z:-15, w:210,h:0.15,d:6, color:0x5ab8e0 },

  // ═══ 生活服务区 ═══
  { id:'runxing_mall', name:'润兴商城', x:18,z:-24, w:10,h:6,d:8, color:0xe6b87a, type:'mall' },
  { id:'cafeteria_runxing', name:'润兴餐厅', x:34,z:-26, w:14,h:8,d:10, color:0xe6c87a, type:'cafeteria' },

  // ═══ 食堂区 ═══
  { id:'cafeteria_boai', name:'博爱餐厅', x:95,z:26, w:14,h:8,d:10, color:0xf0d08a, type:'cafeteria' },
  { id:'cafeteria_haidu', name:'海都餐厅', x:112,z:-28, w:14,h:8,d:10, color:0xe6c87a, type:'cafeteria' },
  { id:'cafeteria_west', name:'西苑餐厅', x:-82,z:-10, w:14,h:8,d:10, color:0xe6c87a, type:'cafeteria' },
  { id:'cafeteria_nw', name:'西北餐厅', x:-108,z:-82, w:14,h:8,d:10, color:0xe6c87a, type:'cafeteria' },

  // ═══ 文体馆 + 体育场 ═══
  { id:'gym', name:'文体馆', x:170,z:26, w:16,h:8,d:14, color:0x9ab0d4, type:'gym' },
  { id:'playground', name:'五环体育场', x:95,z:-72, w:56,h:0.2,d:30, color:0xc4956a },

  // ═══ 东苑宿舍 ═══
  { id:'dorm_east_1', name:'东苑宿舍1号', x:135,z:-30, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_east_2', name:'东苑宿舍2号', x:155,z:-48, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_east_3', name:'东苑宿舍3号', x:155,z:-62, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_east_4', name:'东苑宿舍4号', x:155,z:-76, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_east_6', name:'东苑宿舍6号', x:145,z:-88, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_east_9', name:'东苑宿舍9号', x:125,z:-95, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },

  // ═══ 公主楼 ═══
  { id:'dorm_princess', name:'公主楼', x:46,z:-48, w:20,h:26,d:6, color:0xe47a8a, type:'dorm' },

  // ═══ 校医院+专家楼 ═══
  { id:'hospital', name:'校医院', x:135,z:-58, w:10,h:8,d:8, color:0x6ad489, type:'hospital' },
  { id:'expert_bldg', name:'专家楼', x:160,z:-56, w:10,h:14,d:6, color:0xb8a880, type:'dorm' },

  // ═══ 西苑宿舍 ═══
  { id:'dorm_west_1', name:'西苑宿舍1号', x:-115,z:-28, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_west_3', name:'西苑宿舍3号', x:-115,z:-42, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_west_5', name:'西苑宿舍5号', x:-115,z:-56, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_west_2', name:'西苑宿舍2号', x:-68,z:-28, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_west_4', name:'西苑宿舍4号', x:-68,z:-42, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' },
  { id:'dorm_west_6', name:'西苑宿舍6号', x:-68,z:-56, w:18,h:14,d:6, color:0xd47a6a, type:'dorm' }
];

// 投诉方向
const CATEGORIES = [
  { id: 'hygiene', name: '卫生问题', icon: '🧹', color: '#e67e22' },
  { id: 'safety',  name: '安全隐患', icon: '⚠️', color: '#e74c3c' },
  { id: 'other',   name: '其他',     icon: '📋', color: '#3498db' }
];

// 不可进入的建筑 ID（开放场所，点击直接投诉）
const NON_ENTERABLE = new Set([
  'south_gate','east_gate','northeast_gate','west_gate',
  'hongzi_square','zhishi_square','dingsheng_garden',
  'hongzi_lake','yuxiu_bridge','yixin_pavilion','hongzi_river',
  'playground'
]);

// 建筑内部房间数据（根据建筑高度 h 计算楼层数，每层 3.5units）
const BUILDING_ROOMS = {
  // ═══ 主楼 h=48 → 12层 ═══
  main_building: (() => {
    const rooms = [
      { id:'main-lobby', name:'一楼大厅', floor:1, pos:{x:0,y:0,z:0}, w:14,h:3.5,d:8, color:0xd4d4c0 },
      { id:'main-office1', name:'教务处', floor:1, pos:{x:10,y:0,z:-4}, w:6,h:3.5,d:5, color:0xc8d8b0 },
      { id:'main-office2', name:'学生处', floor:1, pos:{x:-10,y:0,z:-4}, w:6,h:3.5,d:5, color:0xc8d8b0 },
      { id:'main-wc1', name:'一楼卫生间', floor:1, pos:{x:16,y:0,z:4}, w:3,h:3.5,d:3, color:0xb0c8d8 }
    ];
    for (let f = 2; f <= 12; f++) {
      const y = (f-1)*4;
      rooms.push({ id:`main-${f}01`, name:`${f}01 办公室`, floor:f, pos:{x:-8,y,z:0}, w:6,h:3.5,d:5, color:0xc8d8b0 });
      rooms.push({ id:`main-${f}02`, name:`${f}02 办公室`, floor:f, pos:{x:8,y,z:0}, w:6,h:3.5,d:5, color:0xc8d8b0 });
      rooms.push({ id:`main-wc${f}`, name:`${f}楼卫生间`, floor:f, pos:{x:16,y,z:4}, w:3,h:3.5,d:3, color:0xb0c8d8 });
    }
    return rooms;
  })(),

  // ═══ 图书馆 h=20 → 5层 ═══
  library: (() => {
    const rooms = [];
    const floors = [
      [{ id:'lib-1f-study', name:'一楼自习室', w:10,d:7, color:0xd8d0a0 }, { id:'lib-1f-lobby', name:'大厅服务台', w:6,d:4, color:0xe0dcc0 }],
      [{ id:'lib-2f-readA', name:'二楼阅览室A', w:8,d:6, color:0xd4c488 }, { id:'lib-2f-readB', name:'二楼阅览室B', w:8,d:6, color:0xd4c488 }, { id:'lib-2f-digital', name:'电子阅览室', w:5,d:4, color:0xb0d8d0 }],
      [{ id:'lib-3f-journal', name:'三楼期刊室', w:8,d:6, color:0xd0c080 }, { id:'lib-3f-group', name:'小组研讨室', w:5,d:4, color:0xc8d0b8 }],
      [{ id:'lib-4f-archive', name:'四楼档案室', w:8,d:6, color:0xc8c8a0 }, { id:'lib-4f-multi', name:'多媒体教室', w:6,d:5, color:0xb8d0c8 }],
      [{ id:'lib-5f-office', name:'五楼办公室', w:8,d:6, color:0xc8d8b0 }]
    ];
    floors.forEach((fl, fi) => {
      const y = fi*4;
      fl.forEach((r, ri) => {
        rooms.push({ id:r.id, name:r.name, floor:fi+1, pos:{x:(ri-fl.length/2+0.5)*8, y, z:0}, w:r.w, h:3.5, d:r.d, color:r.color });
      });
      rooms.push({ id:`lib-wc${fi+1}`, name:`${fi+1}楼卫生间`, floor:fi+1, pos:{x:10, y, z:6}, w:3, h:3.5, d:3, color:0xb0c8d8 });
    });
    return rooms;
  })(),

  // ═══ 学术会馆 h=6 → 2层 ═══
  academic_hall: [
    { id:'ah-main', name:'学术报告厅', floor:1, pos:{x:0,y:0,z:0}, w:10,h:3.5,d:7, color:0xd8ccb8 },
    { id:'ah-vip', name:'贵宾接待室', floor:1, pos:{x:-6,y:0,z:0}, w:4,h:3.5,d:4, color:0xd0c8a8 },
    { id:'ah-meeting', name:'小型会议室', floor:2, pos:{x:6,y:4,z:0}, w:4,h:3.5,d:4, color:0xc8d0b8 },
    { id:'ah-wc', name:'卫生间', floor:1, pos:{x:0,y:0,z:4}, w:3,h:3.5,d:2, color:0xb0c8d8 }
  ],

  // ═══ 教学楼 A-G h=14 → 4层 ═══
  teach_a: genTeachRooms('A', 4),
  teach_b: genTeachRooms('B', 4),
  teach_c: genTeachRooms('C', 4),
  teach_d: genTeachRooms('D', 4),
  teach_e: genTeachRooms('E', 4),
  teach_f: genTeachRooms('F', 4),
  teach_g: genTeachRooms('G', 4),

  // ═══ 美术馆 h=8 → 2层 ═══
  art_museum: [
    { id:'art-hall', name:'一楼展厅', floor:1, pos:{x:0,y:0,z:0}, w:8,h:3.5,d:5, color:0xe8d8d0 },
    { id:'art-gallery', name:'二楼画廊', floor:2, pos:{x:0,y:4,z:0}, w:8,h:3.5,d:5, color:0xe0d0c8 },
    { id:'art-studio', name:'创作工作室', floor:1, pos:{x:-5,y:0,z:-3}, w:4,h:3.5,d:3, color:0xd8c8c0 },
    { id:'art-wc', name:'卫生间', floor:1, pos:{x:5,y:0,z:3}, w:2.5,h:3.5,d:2.5, color:0xb0c8d8 }
  ],

  // ═══ 科技楼 h=18 → 5层 ═══
  science_bldg: genOfficeRooms('科技', 5, 0x7a9fd4),

  // ═══ 化学楼/生物楼/工程楼/文经楼 h=14 → 4层 ═══
  chem_bldg: genOfficeRooms('化学', 4, 0x8a9fd4),
  bio_bldg: genOfficeRooms('生物', 4, 0x8abf6a),
  eng_bldg: genOfficeRooms('工程', 4, 0x7a8fd4),
  econ_bldg: genOfficeRooms('文经', 4, 0xb8a8c0),

  // ═══ 信息楼 h=8 → 2层 ═══
  info_bldg: genOfficeRooms('信息', 2, 0x6a9fd4),

  // ═══ 润兴商城 h=6 → 2层 ═══
  runxing_mall: [
    { id:'rm-store1', name:'一楼超市', floor:1, pos:{x:0,y:0,z:0}, w:5,h:3.5,d:4, color:0xe8d8a8 },
    { id:'rm-store2', name:'二楼文具店', floor:2, pos:{x:-4,y:4,z:0}, w:3,h:3.5,d:3, color:0xe0d098 },
    { id:'rm-print', name:'打印店', floor:1, pos:{x:4,y:0,z:0}, w:3,h:3.5,d:3, color:0xd8c8a0 },
    { id:'rm-wc', name:'卫生间', floor:1, pos:{x:0,y:0,z:3}, w:2.5,h:3.5,d:2, color:0xb0c8d8 }
  ],

  // ═══ 食堂 h=8 → 2层 ═══
  cafeteria_runxing: genCafeteriaRooms('润兴餐厅', 2),
  cafeteria_boai: genCafeteriaRooms('博爱餐厅', 2),
  cafeteria_haidu: genCafeteriaRooms('海都餐厅', 2),
  cafeteria_west: genCafeteriaRooms('西苑餐厅', 2),
  cafeteria_nw: genCafeteriaRooms('西北餐厅', 2),

  // ═══ 文体馆 h=8 → 2层（大空间）═══
  gym: [
    { id:'gym-basketball', name:'篮球场', floor:1, pos:{x:0,y:0,z:0}, w:10,h:4,d:8, color:0xd8c8a0 },
    { id:'gym-badminton', name:'羽毛球场', floor:1, pos:{x:-7,y:0,z:0}, w:5,h:4,d:5, color:0xd8c8a0 },
    { id:'gym-locker', name:'更衣室', floor:1, pos:{x:8,y:0,z:0}, w:3,h:3.5,d:3, color:0xc8c0b0 },
    { id:'gym-equip', name:'器材室', floor:2, pos:{x:0,y:5,z:5}, w:4,h:3.5,d:3, color:0xc0b8a0 },
    { id:'gym-wc', name:'卫生间', floor:1, pos:{x:8,y:0,z:5}, w:2.5,h:3.5,d:2, color:0xb0c8d8 }
  ],

  // ═══ 公主楼 h=26 → 7层 ═══
  dorm_princess: genDormRooms('公主楼', 7, 0xf0c8c8),

  // ═══ 校医院 h=8 → 2层 ═══
  hospital: [
    { id:'hos-register', name:'挂号处', floor:1, pos:{x:0,y:0,z:0}, w:4,h:3.5,d:4, color:0xd8e8d0 },
    { id:'hos-room1', name:'诊室一', floor:1, pos:{x:-4,y:0,z:0}, w:3,h:3.5,d:3, color:0xd0e0c8 },
    { id:'hos-pharmacy', name:'药房', floor:1, pos:{x:4,y:0,z:0}, w:3,h:3.5,d:3, color:0xc8d8c0 },
    { id:'hos-infusion', name:'输液室', floor:2, pos:{x:0,y:4,z:-3}, w:5,h:3.5,d:3, color:0xd8e0d0 },
    { id:'hos-wc', name:'卫生间', floor:1, pos:{x:0,y:0,z:3}, w:2.5,h:3.5,d:2, color:0xb0c8d8 }
  ],

  // ═══ 专家楼 h=14 → 4层 ═══
  expert_bldg: genDormRooms('专家楼', 4, 0xd8ccb8),

  // ═══ 东苑宿舍 h=14 → 4层 ═══
  dorm_east_1: genDormRooms('东苑1号', 4, 0xe8c0b0),
  dorm_east_2: genDormRooms('东苑2号', 4, 0xe8c0b0),
  dorm_east_3: genDormRooms('东苑3号', 4, 0xe8c0b0),
  dorm_east_4: genDormRooms('东苑4号', 4, 0xe8c0b0),
  dorm_east_6: genDormRooms('东苑6号', 4, 0xe8c0b0),
  dorm_east_9: genDormRooms('东苑9号', 4, 0xe8c0b0),

  // ═══ 西苑宿舍 h=14 → 4层 ═══
  dorm_west_1: genDormRooms('西苑1号', 4, 0xe8c0b0),
  dorm_west_2: genDormRooms('西苑2号', 4, 0xe8c0b0),
  dorm_west_3: genDormRooms('西苑3号', 4, 0xe8c0b0),
  dorm_west_4: genDormRooms('西苑4号', 4, 0xe8c0b0),
  dorm_west_5: genDormRooms('西苑5号', 4, 0xe8c0b0),
  dorm_west_6: genDormRooms('西苑6号', 4, 0xe8c0b0)
};

// ═══ 房间生成辅助函数 ═══
function genTeachRooms(letter, floors) {
  const rooms = [];
  for (let f = 1; f <= floors; f++) {
    const y = (f-1)*4;
    rooms.push({ id:`t${letter.toLowerCase()}-${f}01`, name:`${letter}${f}01 教室`, floor:f, pos:{x:0,y,z:0}, w:7,h:3.5,d:5, color:0xe8d8a0 });
    rooms.push({ id:`t${letter.toLowerCase()}-${f}02`, name:`${letter}${f}02 教室`, floor:f, pos:{x:-7,y,z:0}, w:5,h:3.5,d:5, color:0xe8d8a0 });
    rooms.push({ id:`t${letter.toLowerCase()}-${f}03`, name:`${letter}${f}03 教室`, floor:f, pos:{x:7,y,z:0}, w:5,h:3.5,d:5, color:0xe8d8a0 });
    rooms.push({ id:`t${letter.toLowerCase()}-wc${f}`, name:`${f}楼卫生间`, floor:f, pos:{x:0,y,z:3}, w:3,h:3.5,d:2, color:0xb0c8d8 });
  }
  return rooms;
}

function genOfficeRooms(name, floors, baseColor) {
  const rooms = [];
  for (let f = 1; f <= floors; f++) {
    const y = (f-1)*4;
    rooms.push({ id:`${name}-${f}01`, name:`${name}楼${f}01 实验室`, floor:f, pos:{x:0,y,z:0}, w:7,h:3.5,d:5, color:baseColor });
    rooms.push({ id:`${name}-${f}02`, name:`${name}楼${f}02 办公室`, floor:f, pos:{x:-6,y,z:0}, w:5,h:3.5,d:4, color:(baseColor+0x101010)&0xffffff });
    rooms.push({ id:`${name}-wc${f}`, name:`${f}楼卫生间`, floor:f, pos:{x:0,y,z:3}, w:3,h:3.5,d:2, color:0xb0c8d8 });
  }
  return rooms;
}

function genDormRooms(name, floors, color) {
  const rooms = [];
  for (let f = 1; f <= floors; f++) {
    const y = (f-1)*4;
    rooms.push({ id:`${name}-${f}01`, name:`${f}01 寝室`, floor:f, pos:{x:0,y,z:0}, w:6,h:3,d:4, color });
    rooms.push({ id:`${name}-${f}02`, name:`${f}02 寝室`, floor:f, pos:{x:-6,y,z:0}, w:5,h:3,d:4, color });
    rooms.push({ id:`${name}-${f}03`, name:`${f}03 寝室`, floor:f, pos:{x:6,y,z:0}, w:5,h:3,d:4, color });
    rooms.push({ id:`${name}-wc${f}`, name:`${f}楼卫生间`, floor:f, pos:{x:0,y,z:3}, w:3,h:3,d:2, color:0xb0c8d8 });
  }
  return rooms;
}

function genCafeteriaRooms(name, floors) {
  const rooms = [];
  for (let f = 1; f <= floors; f++) {
    const y = (f-1)*4;
    rooms.push({ id:`${name}-f${f}`, name:`${f}楼就餐区`, floor:f, pos:{x:0,y,z:0}, w:8,h:3.5,d:6, color:0xf0d888 });
    rooms.push({ id:`${name}-kitchen${f}`, name:`${f}楼后厨`, floor:f, pos:{x:0,y,z:-4}, w:5,h:3.5,d:3, color:0xe8c870 });
    rooms.push({ id:`${name}-wc${f}`, name:`${f}楼卫生间`, floor:f, pos:{x:6,y,z:3}, w:3,h:3.5,d:2, color:0xb0c8d8 });
  }
  return rooms;
}

// 挂载到 window 供 module 脚本访问
window.BUILDINGS = BUILDINGS;
window.CATEGORIES = CATEGORIES;
window.NON_ENTERABLE = NON_ENTERABLE;
window.BUILDING_ROOMS = BUILDING_ROOMS;
