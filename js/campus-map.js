/**
 * 3D 校园地图引擎 - 基于 Three.js
 * 从原 campus-3d-map.html 提取并改造：
 *   - 点击建筑时触发 onBuildingSelect(building) 回调（供上层弹出投诉面板）
 *   - 暴露 onBuildingSelect / onLandmarkSelect 回调接口
 *   - 移除内置信息面板逻辑，由上层页面接管
 */
class CampusMap3D {
  constructor(container) {
    this.container = container;
    this.buildingMeshes = [];
    this.hoveredObject = null;

    // 回调接口（由外部设置）
    this.onBuildingSelect = null;   // 点击建筑: (buildingData) => {}
    this.onLandmarkSelect = null;   // 点击地标: (name) => {}

    this._init();
  }

  _init() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 320, 580);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 900);
    this.camera.position.set(130, 115, 175);
    this.camera.lookAt(45, 0, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.labelContainer = document.getElementById('label-container');
    this.labelRenderer = new CSS2DRenderer({ element: this.labelContainer });
    this.labelRenderer.setSize(w, h);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    this.scene.add(new THREE.HemisphereLight(0x87ceeb, 0x7cba3e, 0.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(50, 80, 30);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 4096; dir.shadow.mapSize.height = 4096;
    dir.shadow.camera.left = -220; dir.shadow.camera.right = 220;
    dir.shadow.camera.top = 220; dir.shadow.camera.bottom = -220;
    dir.shadow.camera.near = 0.5; dir.shadow.camera.far = 400;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);
    this.dirLight = dir;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 350;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.target.set(45, 0, -10);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 场景分组：外部校园 / 建筑内部
    this.externalGroup = new THREE.Group();
    this.internalGroup = new THREE.Group();
    this.internalGroup.visible = false;
    this.scene.add(this.externalGroup);
    this.scene.add(this.internalGroup);

    this._setupGround();
    this._setupRoads();
    this._createHongziLakeFC();
    this._createHongziRiverFC();
    this._createBuildings();
    this._createTrees();
    this._createDecorations();
    this._setupEvents();
    this._animate();
  }

  _setupGround() {
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(500,500), new THREE.MeshToonMaterial({ color:0x6aaa3e, side:THREE.DoubleSide }));
    bg.rotation.x = -Math.PI/2; bg.position.set(20,-0.03,-15); bg.receiveShadow=true;
    this.externalGroup.add(bg);

    const campusMat = new THREE.MeshToonMaterial({ color:0x8cd17a, side:THREE.DoubleSide });
    const edgeMat = new THREE.MeshToonMaterial({ color:0x4a7a2a });

    const eastShape = new THREE.Shape();
    eastShape.moveTo(3,57); eastShape.lineTo(140,48); eastShape.lineTo(120,-98); eastShape.lineTo(10,-78); eastShape.closePath();
    const eastGnd = new THREE.Mesh(new THREE.ShapeGeometry(eastShape), campusMat);
    eastGnd.rotation.x=-Math.PI/2; eastGnd.position.set(0,0.005,0); eastGnd.receiveShadow=true;
    this.externalGroup.add(eastGnd);
    const epts = [[-26.1,93.7],[179.4,80.2],[149.4,-138.8],[-15.6,-108.8],[-26.1,93.7]];
    for(let i=0;i<4;i++){
      const [x1,z1]=epts[i],[x2,z2]=epts[i+1];
      const dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz);
      const e = new THREE.Mesh(new THREE.BoxGeometry(len+2,0.15,0.6), edgeMat);
      e.position.set((x1+x2)/2,0.06,(z1+z2)/2);
      e.rotation.y=Math.atan2(dz,dx); e.receiveShadow=true; this.externalGroup.add(e);
    }

    const westShape = new THREE.Shape();
    westShape.moveTo(-30.6,42); westShape.lineTo(5,50); westShape.lineTo(0,-60); westShape.lineTo(-30.6,-50); westShape.closePath();
    const westGnd = new THREE.Mesh(new THREE.ShapeGeometry(westShape), campusMat);
    westGnd.rotation.x=-Math.PI/2; westGnd.position.set(0,0.005,0); westGnd.receiveShadow=true;
    this.externalGroup.add(westGnd);
  }

  _setupRoads() {
    const roadMat = new THREE.MeshToonMaterial({ color: 0x9b8e7a });
    const mainMat = new THREE.MeshToonMaterial({ color: 0x8a7a6a });
    const seg = (x1, z1, x2, z2, w, mat) => {
      const dx = x2 - x1, dz = z2 - z1, len = Math.sqrt(dx * dx + dz * dz);
      const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.15, w), mat);
      s.position.set((x1 + x2) / 2, 0.1, (z1 + z2) / 2);
      s.rotation.y = Math.atan2(dz, dx); s.receiveShadow = true;
      this.externalGroup.add(s);
    };

    // 外围边界道路
    seg(-140, 100, 210, 100, 10, mainMat);   // 北边界
    seg(-140, -110, 210, -110, 10, mainMat);  // 南边界
    seg(-140, -110, -140, 100, 10, mainMat);  // 西边界
    seg(210, -110, 210, 100, 10, mainMat);    // 东边界

    // 南北中轴主干道（穿过校园中心）
    seg(74, 100, 74, -110, 8, roadMat);

    // 东西横向道路
    seg(-140, 60, 210, 60, 6, roadMat);   // 北横道
    seg(-140, 0, 210, 0, 6, roadMat);     // 中横道
    seg(-140, -50, 210, -50, 6, roadMat); // 南横道

    // 西区纵向小路
    seg(-90, 100, -90, -110, 5, roadMat);
    seg(-30, 100, -30, -110, 5, roadMat);

    // 公主楼支路（连接南横道到公主楼）
    seg(46, -50, 46, -58, 4, roadMat);

    // 体育场支路（从中轴+南横道交叉口向南到体育场）
    seg(74, -50, 74, -72, 5, roadMat);

    // 体育场北侧横向路（沿体育场北边）
    seg(74, -72, 130, -72, 4, roadMat);

    // 东苑宿舍区连接路（从体育场向东到宿舍区）
    seg(130, -72, 130, -100, 4, roadMat);

    // 公主楼向西连接路（到西区纵向小路）
    seg(-30, -50, 46, -50, 4, roadMat);
  }

  _createHongziLakeFC() {
    const LCX=100,LCZ=-15;
    const lakeShape=new THREE.Shape();
    lakeShape.moveTo(2,16);
    lakeShape.bezierCurveTo(3,13,5,10,8,7);lakeShape.bezierCurveTo(11,4,15,2,19,1);
    lakeShape.bezierCurveTo(23,0,26,-1,27,-3);lakeShape.bezierCurveTo(28,-6,26,-10,24,-13);
    lakeShape.bezierCurveTo(22,-17,19,-21,15,-24);lakeShape.bezierCurveTo(11,-27,7,-28,3,-28);
    lakeShape.bezierCurveTo(-1,-27,-4,-25,-7,-22);lakeShape.bezierCurveTo(-10,-18,-12,-14,-13,-10);
    lakeShape.bezierCurveTo(-14,-6,-14,-2,-13,2);lakeShape.bezierCurveTo(-11,6,-7,11,-3,14);
    lakeShape.bezierCurveTo(-1,15.5,0.5,16,2,16);

    const lakeMat=new THREE.MeshToonMaterial({ color:0x4aa8d8, transparent:true, opacity:0.9, side:THREE.DoubleSide });
    const lake=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape),lakeMat);
    lake.rotation.x=-Math.PI/2;lake.position.set(LCX,0.08,LCZ);lake.receiveShadow=true;lake.userData={type:'landmark',id:'hongzi_lake',name:'虹子湖'};
    this.externalGroup.add(lake);this.lakeMesh=lake;

    const waterMat=new THREE.MeshToonMaterial({ color:0x6ab8e8, transparent:true, opacity:0.4, side:THREE.DoubleSide });
    const water=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape),waterMat);
    water.rotation.x=-Math.PI/2;water.position.set(LCX,0.12,LCZ);water.userData={type:'water_surface'};this.externalGroup.add(water);this.waterSurface=water;

    const bottom=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape),new THREE.MeshToonMaterial({ color:0x8B7355 }));
    bottom.rotation.x=-Math.PI/2;bottom.position.set(LCX,-0.25,LCZ);bottom.receiveShadow=true;this.externalGroup.add(bottom);

    const stoneMat=new THREE.MeshToonMaterial({ color:0x808080 });
    [[2,16],[5,11],[10,6],[17,1],[25,-4],[24,-12],[18,-21],[9,-27],[-3,-27],[-9,-22],[-13,-14],[-14,-6],[-10,2],[-4,12],[0,15.5],[19,-7],[26,-2],[20,-16],[12,-25],[-5,-18],[-12,-9],[15,-18],[7,-25]].forEach(([sx,sz])=>{
      const st=new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random()*0.4+0.25,0),stoneMat);
      st.position.set(sx+LCX,0.2+Math.random()*0.1,sz+LCZ);st.rotation.set(Math.random(),Math.random(),Math.random());st.castShadow=true;this.externalGroup.add(st);
    });

    const lotusMat=new THREE.MeshToonMaterial({ color:0xFF69B4 });
    [[2,13],[5,9],[8,5],[15,2],[21,-2],[24,-7],[22,-14],[18,-20],[12,-24],[6,-25],[-2,-24],[-8,-19],[-12,-11],[-12,-3],[-6,5],[5,-8],[12,-12],[0,-12],[15,-10],[8,-18]].forEach(([lx,lz])=>{
      const leaf=new THREE.Mesh(new THREE.CircleGeometry(0.8,8),new THREE.MeshToonMaterial({ color:0x228B22, side:THREE.DoubleSide }));
      leaf.rotation.x=-Math.PI/2;leaf.position.set(lx+LCX,0.15,lz+LCZ);this.externalGroup.add(leaf);
      const lo=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8),lotusMat);lo.position.set(lx+LCX,0.5,lz+LCZ);lo.scale.set(1,1.5,1);this.externalGroup.add(lo);
    });

    const path=new THREE.Mesh(new THREE.ShapeGeometry(lakeShape.clone()),new THREE.MeshToonMaterial({ color:0xc4b89a }));
    path.rotation.x=-Math.PI/2;path.position.set(LCX,0.06,LCZ);path.receiveShadow=true;this.externalGroup.add(path);

    this._createYuxiuBridge(LCX,LCZ);
    this._createYixinPavilion(LCX,LCZ);
    this._createYuemingLake(LCX-18,LCZ+15);

    const llDiv=document.createElement('div');llDiv.textContent='虹子湖';llDiv.style.cssText='background:rgba(74,168,216,0.9);color:#fff;padding:4px 12px;border-radius:6px;font-size:14px;font-weight:600;';
    const ll=new CSS2DObject(llDiv);ll.position.set(LCX,2,LCZ-12);this.externalGroup.add(ll);
    const blDiv=document.createElement('div');blDiv.textContent='毓秀桥';blDiv.style.cssText='background:rgba(138,122,106,0.9);color:#fff;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;';
    const bl=new CSS2DObject(blDiv);bl.position.set(LCX,2.5,LCZ);this.externalGroup.add(bl);
    this.lakeTime=0;
  }

  _createYuxiuBridge(lcx,lcz) {
    const group=new THREE.Group();
    group.userData={type:'landmark',id:'yuxiu_bridge',name:'毓秀桥'};
    const bridgeMat=new THREE.MeshToonMaterial({ color:0x9e8c78 });
    const darkMat=new THREE.MeshToonMaterial({ color:0x7a6a5a });
    const deckMat=new THREE.MeshToonMaterial({ color:0xa89880 });
    const railMat=new THREE.MeshToonMaterial({ color:0xb8a890 });
    [-6,0,6].forEach(px=>{[-1.1,1.1].forEach(pz=>{
      const p=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,1.6,8),darkMat);p.position.set(px,-0.2,pz);p.castShadow=true;group.add(p);
      const b=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.9,0.3,8),bridgeMat);b.position.set(px,-0.95,pz);b.castShadow=true;group.add(b);
    })});
    const archH=[0.5,0.8,1,0.8,0.5];
    for(let i=-2;i<=2;i++){const seg=new THREE.Mesh(new THREE.BoxGeometry(3,0.18,2.6),deckMat);seg.position.set(i*3,archH[i+2],0);seg.castShadow=seg.receiveShadow=true;group.add(seg);}
    for(let x=-7.5;x<=7.5;x+=1){const t=(x+7.5)/15,idx=Math.floor(t*4.99),h=archH[idx]+(archH[Math.min(idx+1,4)]-archH[idx])*(t*5-idx);[-1.5,1.5].forEach(rz=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.9,0.12),railMat);p.position.set(x,h+0.55,rz);p.castShadow=true;group.add(p);});}
    [-1.5,1.5].forEach(rz=>{[0.3,0.85].forEach(bh=>{const bar=new THREE.Mesh(new THREE.BoxGeometry(15.2,0.08,0.08),railMat);bar.position.set(0,bh+0.65,rz);group.add(bar);});});
    [-7.8,7.8].forEach(lx=>{
      const lb=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,0.5,8),darkMat);lb.position.set(lx,1.5,0);lb.castShadow=true;group.add(lb);
      const lbody=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,8),new THREE.MeshToonMaterial({ color:0xffd700, emissive:0xffd700, emissiveIntensity:0.4 }));lbody.position.set(lx,1.9,0);group.add(lbody);
    });
    group.position.set(lcx,0,lcz);this.externalGroup.add(group);this.bridgeGroup=group;
  }

  _createYixinPavilion(lcx,lcz) {
    const group=new THREE.Group();
    const mat=new THREE.MeshToonMaterial({ color:0x6a8a5a });
    const px=lcx-16,pz=lcz-5;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.2,0.5,8),mat);base.position.set(0,0.25,0);base.castShadow=true;group.add(base);
    [-1.2,1.2].forEach(cx=>{[-1.2,1.2].forEach(cz=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,2.5,8),mat);p.position.set(cx,1.5,cz);p.castShadow=true;group.add(p);});});
    const roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.5,8),mat);roof.position.set(0,3.2,0);roof.castShadow=true;group.add(roof);
    group.position.set(px,0,pz);group.userData={type:'landmark',id:'yixin_pavilion',name:'怡心亭'};this.externalGroup.add(group);
  }

  _createYuemingLake(yx,yz) {
    const shape=new THREE.Shape();shape.moveTo(0,6);
    for(let i=1;i<=16;i++){const a=i/16*Math.PI*2,r=5.5+Math.sin(a*3)*0.8+Math.cos(a*2)*0.5;shape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}shape.closePath();
    const lakeMat=new THREE.MeshToonMaterial({ color:0x4a9ad4, transparent:true, opacity:0.88, side:THREE.DoubleSide });
    const lake=new THREE.Mesh(new THREE.ShapeGeometry(shape),lakeMat);lake.rotation.x=-Math.PI/2;lake.position.set(yx,0.07,yz);lake.receiveShadow=true;lake.userData={type:'landmark',id:'yueming_lake',name:'月明湖'};this.externalGroup.add(lake);
    const wave=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshToonMaterial({ color:0x6ab8e8, transparent:true, opacity:0.35, side:THREE.DoubleSide }));wave.rotation.x=-Math.PI/2;wave.position.set(yx,0.11,yz);wave.userData={type:'water_surface'};this.externalGroup.add(wave);
    const bottom=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshToonMaterial({ color:0x8B7355 }));bottom.rotation.x=-Math.PI/2;bottom.position.set(yx,-0.18,yz);bottom.receiveShadow=true;this.externalGroup.add(bottom);
    const stoneMat=new THREE.MeshToonMaterial({ color:0x808080 });
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=5.7+(i%2===0?0.3:-0.1);const st=new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random()*0.25+0.15,0),stoneMat);st.position.set(yx+Math.cos(a)*r,0.15+Math.random()*0.08,yz+Math.sin(a)*r);st.castShadow=true;this.externalGroup.add(st);}
    const lotusMat=new THREE.MeshToonMaterial({ color:0xFF69B4 });
    [[-2,1],[2,-2],[0,3],[-3,-1],[1,-3]].forEach(([lx,lz])=>{const leaf=new THREE.Mesh(new THREE.CircleGeometry(0.45,8),new THREE.MeshToonMaterial({ color:0x228B22, side:THREE.DoubleSide }));leaf.rotation.x=-Math.PI/2;leaf.position.set(yx+lx,0.12,yz+lz);this.externalGroup.add(leaf);const lo=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8),lotusMat);lo.position.set(yx+lx,0.35,yz+lz);lo.scale.set(1,1.5,1);this.externalGroup.add(lo);});
    const lblDiv=document.createElement('div');lblDiv.textContent='月明湖';lblDiv.style.cssText='background:rgba(74,154,212,0.85);color:#fff;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:600;';const lbl=new CSS2DObject(lblDiv);lbl.position.set(yx,1.5,yz+4);this.externalGroup.add(lbl);
  }

  _createHongziRiverFC() {
    const RY=0.07;
    const waterMat=new THREE.MeshToonMaterial({ color:0x5ab8e0, transparent:true, opacity:0.84, side:THREE.DoubleSide });
    const bottomMat=new THREE.MeshToonMaterial({ color:0x8B7355 });
    const edgeMat=new THREE.MeshToonMaterial({ color:0x808080 });

    const westRiver=new THREE.Shape();
    westRiver.moveTo(52,27);westRiver.bezierCurveTo(30,27,5,26,-10,22);westRiver.bezierCurveTo(-16,20,-20,16,-22,12);
    westRiver.bezierCurveTo(-23,4,-23,-10,-22,-30);westRiver.bezierCurveTo(-21,-50,-21,-70,-21,-82);westRiver.lineTo(-20,-87);
    westRiver.lineTo(-17,-87);westRiver.bezierCurveTo(-18,-70,-18,-50,-19,-30);westRiver.bezierCurveTo(-20,-10,-20,4,-18,12);
    westRiver.bezierCurveTo(-16,16,-12,20,0,24);westRiver.bezierCurveTo(15,25,35,26,52,25);westRiver.closePath();
    const wM=new THREE.Mesh(new THREE.ShapeGeometry(westRiver),waterMat);wM.rotation.x=-Math.PI/2;wM.position.set(0,RY,0);wM.receiveShadow=true;wM.userData={type:'landmark',id:'hongzi_river_west',name:'虹子河(西段)'};this.externalGroup.add(wM);
    const wB=new THREE.Mesh(new THREE.ShapeGeometry(westRiver),bottomMat);wB.rotation.x=-Math.PI/2;wB.position.set(0,-0.18,0);wB.receiveShadow=true;this.externalGroup.add(wB);

    const eastRiver=new THREE.Shape();
    eastRiver.moveTo(84,-8);eastRiver.bezierCurveTo(95,-2,110,6,125,14);eastRiver.bezierCurveTo(135,20,142,26,148,32);
    eastRiver.bezierCurveTo(152,45,155,60,156,75);eastRiver.bezierCurveTo(157,80,158,83,158,87);
    eastRiver.lineTo(162,87);eastRiver.bezierCurveTo(161,83,160,78,158,70);eastRiver.bezierCurveTo(155,55,152,40,148,28);
    eastRiver.bezierCurveTo(140,20,130,12,115,4);eastRiver.bezierCurveTo(100,-3,90,-7,84,-13);eastRiver.closePath();
    const eM=new THREE.Mesh(new THREE.ShapeGeometry(eastRiver),waterMat);eM.rotation.x=Math.PI/2;eM.position.set(0,RY,0);eM.receiveShadow=true;eM.userData={type:'landmark',id:'hongzi_river_east',name:'虹子河(东段)'};this.externalGroup.add(eM);
    const eB=new THREE.Mesh(new THREE.ShapeGeometry(eastRiver),bottomMat);eB.rotation.x=Math.PI/2;eB.position.set(0,-0.18,0);eB.receiveShadow=true;this.externalGroup.add(eB);

    [[52,-27],[30,-27],[5,-26],[-10,-22],[-16,-20],[-22,-12],[-23,-4],[-23,10],[-22,30],[-21,50],[-21,70],[-21,82],[-17,87],[-18,70],[-18,50],[-19,30],[-20,10],[-20,-4],[0,-24],[15,-25],[35,-26],[52,-25]].forEach(([sx,sz])=>{const st=new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random()*0.25+0.15,0),edgeMat);st.position.set(sx,0.15+Math.random()*0.1,sz);st.castShadow=true;this.externalGroup.add(st);});
    [[84,-10],[95,-3],[110,6],[125,14],[135,22],[148,32],[153,45],[155,60],[156,75],[157,82],[158,87],[162,87],[160,78],[157,65],[154,50],[150,35],[140,24],[128,14],[112,4],[96,-5],[85,-12]].forEach(([sx,sz])=>{const st=new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random()*0.25+0.15,0),edgeMat);st.position.set(sx,0.15+Math.random()*0.1,sz);st.castShadow=true;this.externalGroup.add(st);});

    this._createRiverBridge(-18,-14);this._createRiverBridge(-21,30);
    this._createRiverBridge(118,10);this._createRiverBridge(156,60);

    const lotusMat=new THREE.MeshToonMaterial({ color:0xFF69B4 });
    [[-15,-20],[-10,-18],[-5,-14],[0,-10],[-20,0],[-20,20],[-20,50]].forEach(([lx,lz])=>{const leaf=new THREE.Mesh(new THREE.CircleGeometry(0.7,8),new THREE.MeshToonMaterial({ color:0x228B22, side:THREE.DoubleSide }));leaf.rotation.x=-Math.PI/2;leaf.position.set(lx,0.12,lz);this.externalGroup.add(leaf);const lo=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8),lotusMat);lo.position.set(lx,0.42,lz);lo.scale.set(1,1.6,1);this.externalGroup.add(lo);});
    [[95,0],[115,10],[135,22],[148,32],[154,48],[156,65],[157,80]].forEach(([lx,lz])=>{const leaf=new THREE.Mesh(new THREE.CircleGeometry(0.7,8),new THREE.MeshToonMaterial({ color:0x228B22, side:THREE.DoubleSide }));leaf.rotation.x=-Math.PI/2;leaf.position.set(lx,0.12,lz);this.externalGroup.add(leaf);const lo=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,8),lotusMat);lo.position.set(lx,0.42,lz);lo.scale.set(1,1.6,1);this.externalGroup.add(lo);});

    const l1Div=document.createElement('div');l1Div.textContent='虹子河';l1Div.style.cssText='background:rgba(90,184,224,0.9);color:#fff;padding:3px 10px;border-radius:5px;font-size:12px;font-weight:600;';const l1=new CSS2DObject(l1Div);l1.position.set(-10,1.5,10);this.externalGroup.add(l1);
    const l2Div=document.createElement('div');l2Div.textContent='虹子河东段';l2Div.style.cssText='background:rgba(90,184,224,0.9);color:#fff;padding:3px 10px;border-radius:5px;font-size:12px;font-weight:600;';const l2=new CSS2DObject(l2Div);l2.position.set(130,1.5,20);this.externalGroup.add(l2);
  }

  _createRiverBridge(bx,bz) {
    const g=new THREE.Group();const m=new THREE.MeshToonMaterial({ color:0x8a7a6a });const r=new THREE.MeshToonMaterial({ color:0xa89880 });
    const d=new THREE.Mesh(new THREE.BoxGeometry(10,0.22,4),m);d.position.set(0,0.35,0);d.castShadow=d.receiveShadow=true;g.add(d);
    [-1.8,1.8].forEach(rz=>{[-4,-2,0,2,4].forEach(rx=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.7,0.12),r);p.position.set(rx,0.55,rz);p.castShadow=true;g.add(p);});[-3,1].forEach(rx=>{const b=new THREE.Mesh(new THREE.BoxGeometry(4,0.06,0.06),r);b.position.set(rx,0.85,rz);g.add(b);});});
    g.position.set(bx,0,bz);g.userData={type:'landmark',id:'river_bridge_'+bx+'_'+bz,name:'虹子河桥'};this.externalGroup.add(g);
  }

  _createBuildings() {
    BUILDINGS.forEach(b=>{
      if(b.id==='hongzi_lake'||b.id==='yuxiu_bridge'||b.id==='yixin_pavilion'||b.id==='yueming_lake'||b.id==='hongzi_river')return;
      if(b.id==='playground'){this._createPlayground(b);return;}
      if(b.id==='south_gate'||b.id==='east_gate'){this._createGate(b);return;}

      const t = b.type || 'box';
      switch(t) {
        case 'tower': this._createTower(b); break;
        case 'dome': this._createDome(b); break;
        case 'teach': this._createTeach(b); break;
        case 'dorm': this._createDorm(b); break;
        case 'cafeteria': this._createCafeteria(b); break;
        case 'gym': this._createGym(b); break;
        case 'mall': this._createMall(b); break;
        case 'hospital': this._createHospital(b); break;
        case 'museum': this._createMuseum(b); break;
        default: this._createStandardBuilding(b);
      }
    });
  }

  // 添加标签公共方法
  _addLabel(text, x, y, z) {
    const lDiv=document.createElement('div');lDiv.textContent=text;
    lDiv.style.cssText='background:#fff;color:#1a2e22;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,0.15);border:1px solid #ddd;';
    const lbl=new CSS2DObject(lDiv);lbl.position.set(x,y,z);this.externalGroup.add(lbl);
    return lbl;
  }

  // 公共轮廓方法
  _addEdges(mesh, geo, color=0x333333) {
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color }));
    mesh.add(line);
  }

  // 塔楼（主楼）- 细高 + 尖顶
  _createTower(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 平顶
    const roofGeo = new THREE.BoxGeometry(b.w+1, 0.6, b.d+1);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.5) }));
    roof.position.set(b.x, b.h+0.3, b.z);roof.castShadow=true;
    this._addEdges(roof, roofGeo, 0x222222);
    this.externalGroup.add(roof);

    // 窗户列
    this._addWindows(b, 0xffffff, 1.4, 0.9);

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h+1.5, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 穹顶（图书馆、学术会馆）
  _createDome(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h*0.7,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h*0.35,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 穹顶
    const domeGeo = new THREE.SphereGeometry(Math.min(b.w,b.d)/2, 16, 8, 0, Math.PI*2, 0, Math.PI/2.5);
    const dome = new THREE.Mesh(domeGeo, new THREE.MeshToonMaterial({ color:this._lighten(b.color,1.15) }));
    dome.position.set(b.x, b.h*0.7, b.z);dome.castShadow=true;
    const domeEdges = new THREE.EdgesGeometry(domeGeo);
    dome.add(new THREE.LineSegments(domeEdges, new THREE.LineBasicMaterial({color:0x333333})));
    this.externalGroup.add(dome);

    this._addWindows(b, 0xffffff, 1.5, 1);
    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h + 1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 教学楼 - 长条 + 坡屋顶
  _createTeach(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 坡屋顶
    const roofGeo = new THREE.ConeGeometry(b.w/1.6, b.h/5, 4);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.5) }));
    roof.position.set(b.x, b.h + b.h/10, b.z);roof.rotation.y = Math.PI/4;roof.castShadow=true;
    const roofEdges = new THREE.EdgesGeometry(roofGeo);
    roof.add(new THREE.LineSegments(roofEdges, new THREE.LineBasicMaterial({color:0x222222})));
    this.externalGroup.add(roof);

    // 正面走廊柱子
    for(let i=-3;i<=3;i++){
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,b.h*0.6,8),
        new THREE.MeshToonMaterial({ color:0xddddd0 }));
      col.position.set(b.x + i*b.w/8, b.h*0.3, b.z + b.d/2 + 0.3);col.castShadow=true;
      this.externalGroup.add(col);
    }

    this._addWindows(b, 0xffffff, 1.4, 0.9);
    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h + b.h/4 + 1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 宿舍楼 - 长条 + 阳台横条
  _createDorm(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 平屋顶
    const roofGeo = new THREE.BoxGeometry(b.w+1, 0.5, b.d+1);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.5) }));
    roof.position.set(b.x, b.h+0.25, b.z);roof.castShadow=true;
    this._addEdges(roof, roofGeo, 0x222222);
    this.externalGroup.add(roof);

    // 阳台横条
    const floors=Math.floor(b.h/3.5);
    for(let f=0;f<floors;f++){
      const balcony = new THREE.Mesh(new THREE.BoxGeometry(b.w-2,0.3,0.8),
        new THREE.MeshToonMaterial({ color:0xeeeeee }));
      balcony.position.set(b.x, 2+f*3.5, b.z + b.d/2 + 0.5);balcony.castShadow=true;
      this.externalGroup.add(balcony);
      this._addEdges(balcony, new THREE.BoxGeometry(b.w-2,0.3,0.8), 0x999999);
    }

    this._addWindows(b, 0xffffff, 1.2, 0.8);
    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h+1.5, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 食堂 - 宽扁 + 弧形顶
  _createCafeteria(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 弧形屋顶
    const curve = new THREE.EllipseCurve(0,0, b.w/2, b.h/3, 0, Math.PI, false, 0);
    const archGeo = new THREE.ExtrudeGeometry(new THREE.Shape(curve.getPoints(20)), {depth:b.d, bevelEnabled:false});
    const arch = new THREE.Mesh(archGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.6) }));
    arch.position.set(b.x - b.w/2, b.h, b.z - b.d/2);arch.castShadow=true;
    this.externalGroup.add(arch);

    // 大窗户
    for(let i=-2;i<=2;i++){
      const win = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.15),
        new THREE.MeshToonMaterial({ color:0xffffff, emissive:0x222200, emissiveIntensity:0.2 }));
      win.position.set(b.x + i*b.w/7, b.h*0.6, b.z + b.d/2 + 0.08);
      this.externalGroup.add(win);
    }

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h + b.h/3 + 1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 文体馆 - 大跨拱顶
  _createGym(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h*0.6,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h*0.3,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 拱形屋顶
    const archShape = new THREE.Shape();
    archShape.moveTo(-b.w/2,0);
    archShape.quadraticCurveTo(0, b.h*0.5, b.w/2, 0);
    archShape.lineTo(b.w/2, -0.3);archShape.lineTo(-b.w/2, -0.3);archShape.closePath();
    const archGeo = new THREE.ExtrudeGeometry(archShape, {depth:b.d, bevelEnabled:false});
    const arch = new THREE.Mesh(archGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.55) }));
    arch.position.set(b.x - b.w/2, b.h*0.6, b.z - b.d/2);arch.castShadow=true;
    this.externalGroup.add(arch);

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h + 1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 商城 - 矮方 + 招牌
  _createMall(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 招牌条
    const sign = new THREE.Mesh(new THREE.BoxGeometry(b.w-1, 1.2, 0.3),
      new THREE.MeshToonMaterial({ color:0xff6633 }));
    sign.position.set(b.x, b.h-1, b.z + b.d/2 + 0.2);sign.castShadow=true;
    this.externalGroup.add(sign);

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h+1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 校医院 - 矮方 + 十字
  _createHospital(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 十字标志
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 0.3), new THREE.MeshToonMaterial({ color:0xff4444 }));
    crossH.position.set(b.x, b.h+1.5, b.z + b.d/2);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.3), new THREE.MeshToonMaterial({ color:0xff4444 }));
    crossV.position.set(b.x, b.h+1.5, b.z + b.d/2);
    this.externalGroup.add(crossH);this.externalGroup.add(crossV);

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h+3, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 美术馆 - 方盒 + 玻璃幕墙
  _createMuseum(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};
    this._addEdges(mesh, geo);

    // 玻璃幕墙
    const glassGeo = new THREE.BoxGeometry(b.w-2, b.h-2, 0.2);
    const glass = new THREE.Mesh(glassGeo, new THREE.MeshToonMaterial({
      color:0xaaddff, emissive:0x334466, emissiveIntensity:0.15
    }));
    glass.position.set(b.x, b.h/2, b.z + b.d/2 + 0.1);glass.castShadow=true;
    this.externalGroup.add(glass);

    this.externalGroup.add(mesh);
    this._addLabel(b.name, b.x, b.h+1, b.z);
    this.buildingMeshes.push({mesh, data:b});
  }

  // 窗户公共方法
  _addWindows(b, color, ww=1.4, wh=0.9) {
    const wMat=new THREE.MeshToonMaterial({ color, emissive:0x334455, emissiveIntensity:0.3 });
    const floors=Math.max(1,Math.floor(b.h/3)), wpf=Math.max(2,Math.floor(b.w/4));
    for(let f=0;f<floors;f++){for(let w=0;w<wpf;w++){
      const xOff=-b.w/2+2+w*(b.w-4)/(wpf-1);
      const wf=new THREE.Mesh(new THREE.BoxGeometry(ww,wh,0.15),wMat);
      wf.position.set(b.x+xOff,2+f*3,b.z+b.d/2+0.08);this.externalGroup.add(wf);
      const wb=new THREE.Mesh(new THREE.BoxGeometry(ww,wh,0.15),wMat);
      wb.position.set(b.x+xOff,2+f*3,b.z-b.d/2-0.08);this.externalGroup.add(wb);
    }}
  }

  _createStandardBuilding(b) {
    const geo=new THREE.BoxGeometry(b.w,b.h,b.d);
    const mat=new THREE.MeshToonMaterial({ color:b.color });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(b.x,b.h/2,b.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.userData={type:'building',buildingId:b.id,buildingData:b};

    // 黑色描边轮廓线
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 }));
    mesh.add(line);

    // 屋顶（更深色，加轮廓）
    const roofGeo = new THREE.BoxGeometry(b.w+0.6,0.5,b.d+0.6);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshToonMaterial({ color:this._darken(b.color,0.55) }));
    roof.position.set(b.x,b.h+0.25,b.z);roof.castShadow=true;roof.userData=mesh.userData;

    // 屋顶轮廓
    const roofEdges = new THREE.EdgesGeometry(roofGeo);
    const roofLine = new THREE.LineSegments(roofEdges, new THREE.LineBasicMaterial({ color: 0x222222 }));
    roof.add(roofLine);

    // 窗户（更鲜明的白色）
    const wMat=new THREE.MeshToonMaterial({ color:0xffffff, emissive:0x334455, emissiveIntensity:0.3 });
    const floors=Math.max(1,Math.floor(b.h/3)), wpf=Math.max(2,Math.floor(b.w/4));
    for(let f=0;f<floors;f++){for(let w=0;w<wpf;w++){
      const xOff=-b.w/2+2+w*(b.w-4)/(wpf-1);
      const wf=new THREE.Mesh(new THREE.BoxGeometry(1.8,1,0.15),wMat);wf.position.set(b.x+xOff,2+f*3,b.z+b.d/2+0.08);this.externalGroup.add(wf);
      const wb=new THREE.Mesh(new THREE.BoxGeometry(1.8,1,0.15),wMat);wb.position.set(b.x+xOff,2+f*3,b.z-b.d/2-0.08);this.externalGroup.add(wb);
    }}

    // 门（更鲜明）
    const d=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.2,0.2),new THREE.MeshToonMaterial({ color:0x5D3A1A }));
    d.position.set(b.x,1.6,b.z+b.d/2+0.11);this.externalGroup.add(d);

    this.externalGroup.add(mesh);this.externalGroup.add(roof);

    // 标签（白底提升可读性）
    const lDiv=document.createElement('div');lDiv.textContent=b.name;
    lDiv.style.cssText='background:#fff;color:#1a2e22;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,0.15);border:1px solid #ddd;';
    const lbl=new CSS2DObject(lDiv);lbl.position.set(b.x,b.h+1.5,b.z);this.externalGroup.add(lbl);
    this.buildingMeshes.push({mesh,roof,data:b,label:lbl});
  }

  _createPlayground(b) {
    const cx=b.x,cz=b.z;
    const trackShape=new THREE.Shape();trackShape.ellipse(0,0,28,16,0,0,Math.PI*2,false);
    const track=new THREE.Mesh(new THREE.ShapeGeometry(trackShape),new THREE.MeshToonMaterial({ color:0xb8804a }));
    track.rotation.x=-Math.PI/2;track.position.set(cx,0.08,cz);track.receiveShadow=true;this.externalGroup.add(track);

    for(let i=1;i<=5;i++){const r=new THREE.Mesh(new THREE.RingGeometry(28-i*2.5+0.05,28-i*2.5+0.2,64),new THREE.MeshBasicMaterial({ color:0xffffff, side:THREE.DoubleSide }));r.rotation.x=-Math.PI/2;r.position.set(cx,0.1,cz);r.scale.set(1,16/28,1);this.externalGroup.add(r);}

    const fieldShape=new THREE.Shape();fieldShape.ellipse(0,0,18,12,0,0,Math.PI*2,false);
    const field=new THREE.Mesh(new THREE.ShapeGeometry(fieldShape),new THREE.MeshToonMaterial({ color:0x4a8c2a }));
    field.rotation.x=-Math.PI/2;field.position.set(cx,0.09,cz);field.receiveShadow=true;this.externalGroup.add(field);

    const lMat=new THREE.MeshBasicMaterial({ color:0xffffff, side:THREE.DoubleSide });
    const cl=new THREE.Mesh(new THREE.PlaneGeometry(0.3,24),lMat);cl.rotation.x=-Math.PI/2;cl.position.set(cx,0.11,cz);this.externalGroup.add(cl);
    const cc=new THREE.Mesh(new THREE.RingGeometry(2.5,2.8,32),lMat);cc.rotation.x=-Math.PI/2;cc.position.set(cx,0.11,cz);this.externalGroup.add(cc);
    [-10,10].forEach(off=>{const box=new THREE.Mesh(new THREE.PlaneGeometry(0.3,8),lMat);box.rotation.x=-Math.PI/2;box.position.set(cx,0.11,cz+off);this.externalGroup.add(box);});

    const gMat=new THREE.MeshToonMaterial({ color:0xffffff });
    [-11,11].forEach(off=>{[[-2,off],[2,off]].forEach(([x,z])=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,2.5,8),gMat);p.position.set(cx+x,1.25,cz+z);p.castShadow=true;this.externalGroup.add(p);});const cb=new THREE.Mesh(new THREE.BoxGeometry(4,0.2,0.2),gMat);cb.position.set(cx,2.5,cz+off);cb.castShadow=true;this.externalGroup.add(cb);const n=new THREE.Mesh(new THREE.PlaneGeometry(4,2.5),new THREE.MeshToonMaterial({ color:0xffffff, transparent:true, opacity:0.3, side:THREE.DoubleSide }));n.position.set(cx,1.25,cz+off*0.9);this.externalGroup.add(n);});

    const sColors=[0x999999,0x777777,0xbbbbbb];
    for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(16,3-i*0.6,42+i*3),new THREE.MeshToonMaterial({ color:sColors[i] }));s.position.set(cx,1.5+i*1.2,cz+22-i*2);s.castShadow=s.receiveShadow=true;this.externalGroup.add(s);}

    const bMat=new THREE.MeshToonMaterial({ color:0xff6600 });
    [[-19,-13],[19,-13],[-19,13],[19,13]].forEach(([x,z])=>{const bb=new THREE.Mesh(new THREE.BoxGeometry(0.2,1.5,2),bMat);bb.position.set(cx+x,3.5,cz+z);bb.castShadow=true;this.externalGroup.add(bb);const p=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.12,4,8),new THREE.MeshToonMaterial({ color:0x888888 }));p.position.set(cx+x,1.5,cz+z);p.castShadow=true;this.externalGroup.add(p);const rim=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.08,8,16),new THREE.MeshToonMaterial({ color:0xff2200 }));rim.position.set(cx+x,3.05,cz+z+0.5);rim.rotation.x=Math.PI/2;this.externalGroup.add(rim);});

    const cb2=new THREE.Mesh(new THREE.BoxGeometry(b.w+10,0.5,b.d+10),new THREE.MeshBasicMaterial({ visible:false }));
    cb2.position.set(cx,0.25,cz);cb2.userData={type:'building',buildingId:b.id,buildingData:b};this.externalGroup.add(cb2);

    const lDiv=document.createElement('div');lDiv.textContent=b.name;lDiv.style.cssText='background:rgba(0,0,0,0.8);color:#fff;padding:6px 14px;border-radius:6px;font-size:14px;font-weight:600;white-space:nowrap;pointer-events:none;';const lbl=new CSS2DObject(lDiv);lbl.position.set(cx,8,cz);this.externalGroup.add(lbl);
    this.buildingMeshes.push({mesh:cb2,data:b,label:lbl});
  }

  _createGate(b) {
    const pMat=new THREE.MeshToonMaterial({ color:0x8a7a6a });
    let mesh;
    if(b.id==='south_gate'){
      [-2.5,2.5].forEach(off=>{const p=new THREE.Mesh(new THREE.BoxGeometry(1,6,1),pMat);p.position.set(b.x+off,3,b.z);p.castShadow=true;p.userData={type:'building',buildingId:b.id,buildingData:b};this.externalGroup.add(p);});
      const t=new THREE.Mesh(new THREE.BoxGeometry(6,0.6,1),pMat);t.position.set(b.x,6,b.z);t.castShadow=true;t.userData={type:'building',buildingId:b.id,buildingData:b};this.externalGroup.add(t);mesh=t;
    }else{
      [-1,1].forEach(off=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,5,0.8),pMat);p.position.set(b.x,2.5,b.z+off*3);p.castShadow=true;p.userData={type:'building',buildingId:b.id,buildingData:b};this.externalGroup.add(p);});
      const t=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,6),pMat);t.position.set(b.x,5,b.z);t.castShadow=true;t.userData={type:'building',buildingId:b.id,buildingData:b};this.externalGroup.add(t);mesh=t;
    }
    const lDiv=document.createElement('div');lDiv.textContent=b.name;lDiv.style.cssText='background:rgba(138,122,106,0.9);color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:500;white-space:nowrap;pointer-events:none;';const lbl=new CSS2DObject(lDiv);lbl.position.set(b.x,7,b.z);this.externalGroup.add(lbl);
    this.buildingMeshes.push({mesh,data:b,label:lbl});
  }

  _createTrees() {
    const treePositions=[
      [-128.1,89.2],[-83.1,89.2],[-45.6,89.2],[-30.6,89.2],[-0.6,89.2],[29.4,89.2],[74.4,89.2],[119.4,89.2],[156.9,89.2],
      [-30.6,74.2],[-30.6,53.2],[-30.6,32.2],[-30.6,14.2],[-30.6,-3.8],[-30.6,-21.8],[-30.6,-42.8],[-30.6,-63.8],[-30.6,-84.8],
      [41.4,74.2],[107.4,74.2],[41.4,65.2],[107.4,65.2],[101.4,71.2],[143.4,71.2],[11.4,71.2],[53.4,71.2],
      [38.4,62.2],[110.4,62.2],[38.4,26.2],[110.4,26.2],[2.4,65.2],[2.4,53.2],[2.4,23.2],[2.4,11.2],[2.4,5.2],[2.4,-3.8],
      [146.4,65.2],[146.4,53.2],[146.4,23.2],[146.4,11.2],[146.4,5.2],[146.4,-3.8],
      [48,3],[60,3],[72,3],[82,0],[86,-10],[86,-26],[82,-38],[72,-48],[58,-48],[48,-36],[44,-24],[44,-12],[48,-6],
      [98.4,-30.8],[146.4,-30.8],[32.4,-32.3],[20.4,-27.8],[14.4,-27.8],[137.4,-36.8],[137.4,-48.8],[137.4,-60.8],[137.4,-72.8],
      [167.4,-33.8],[167.4,-48.8],[167.4,-66.8],[74.4,-72.8],[119.4,-72.8],[59.4,-84.8],[119.4,-84.8],
      [-38.1,50.2],[-38.1,32.2],[-48.6,44.2],[-48.6,29.2],[-105.6,-18.8],[-72.6,-18.8],[-105.6,-36.8],[-72.6,-36.8],
      [-105.6,-51.8],[-72.6,-51.8],[-105.6,-66.8],[-72.6,-66.8],[-120.6,-78.8],[-90.6,-78.8]
    ];
    treePositions.forEach(([x,z])=>this._createTree(x,z));
  }

  _createTree(x,z) {
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.4,2.5,8),new THREE.MeshToonMaterial({ color:0x8B4513 }));
    t.position.set(x,1.25,z);t.castShadow=true;this.externalGroup.add(t);
    const lMat=new THREE.MeshToonMaterial({ color:0x3d8b3d });
    const l1=new THREE.Mesh(new THREE.SphereGeometry(1.8,12,8),lMat);l1.position.set(x,3.5,z);l1.castShadow=true;this.externalGroup.add(l1);
    const l2=new THREE.Mesh(new THREE.SphereGeometry(1.4,12,8),lMat);l2.position.set(x+0.7,3,z+0.4);l2.castShadow=true;this.externalGroup.add(l2);
    const l3=new THREE.Mesh(new THREE.SphereGeometry(1.1,12,8),lMat);l3.position.set(x-0.6,3.2,z-0.5);l3.castShadow=true;this.externalGroup.add(l3);
  }

  _createDecorations() {
    const fb=new THREE.Mesh(new THREE.CylinderGeometry(4,4,0.3,16),new THREE.MeshToonMaterial({ color:0xff6b9d }));
    fb.position.set(70,0.15,34);fb.receiveShadow=true;this.externalGroup.add(fb);

    const fp=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,14,8),new THREE.MeshToonMaterial({ color:0xcccccc }));
    fp.position.set(70,7,42);fp.castShadow=true;this.externalGroup.add(fp);
    const ba=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12),new THREE.MeshToonMaterial({ color:0xffd700 }));
    ba.position.set(70,14.2,42);ba.castShadow=true;this.externalGroup.add(ba);

    [-18,18].forEach(dx=>{[-18,18].forEach(dz=>{if(Math.abs(dx)===18&&dz===0)return;const f=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,0.3,8),new THREE.MeshToonMaterial({ color:0xcc6699 }));f.position.set(70+dx,0.15,42+dz);f.receiveShadow=true;this.externalGroup.add(f);});});

    const zs=new THREE.Mesh(new THREE.CylinderGeometry(3,3,0.2,16),new THREE.MeshToonMaterial({ color:0xa4b8c0 }));
    zs.position.set(102,0.12,40);zs.receiveShadow=true;this.externalGroup.add(zs);

    const ds=new THREE.Mesh(new THREE.CylinderGeometry(4,4,0.3,16),new THREE.MeshToonMaterial({ color:0x88aa66 }));
    ds.position.set(38,0.12,40);ds.receiveShadow=true;this.externalGroup.add(ds);
  }

  _darken(hex,f){return (Math.floor(Math.max(0,((hex>>16)&0xff)*f))<<16)|(Math.floor(Math.max(0,((hex>>8)&0xff)*f))<<8)|Math.floor(Math.max(0,(hex&0xff)*f));}
  _lighten(hex,f){return (Math.floor(Math.min(255,((hex>>16)&0xff)*f))<<16)|(Math.floor(Math.min(255,((hex>>8)&0xff)*f))<<8)|Math.floor(Math.min(255,(hex&0xff)*f));}

  _setupEvents() {
    const canvas=this.renderer.domElement;
    canvas.addEventListener('click',e=>this._onClick(e));
    canvas.addEventListener('mousemove',e=>this._onMouseMove(e));
    window.addEventListener('resize',()=>this._onResize());
  }

  _getIntersectObjects() {
    const objs=[];
    this.buildingMeshes.forEach(b=>{if(b.mesh&&b.mesh.visible)objs.push(b.mesh);if(b.roof&&b.roof.visible)objs.push(b.roof);});
    if(this.bridgeGroup){this.bridgeGroup.children.forEach(c=>objs.push(c));}
    return objs;
  }

  // ★ 改造点：点击建筑触发回调，由上层处理投诉面板
  _onClick(e) {
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    this.mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const intersects=this.raycaster.intersectObjects(this._getIntersectObjects(),false);
    if(intersects.length>0){
      for(let i=0;i<intersects.length;i++){
        const ud=intersects[i].object.userData;
        if(ud.type==='building'&&ud.buildingData){
          if(this.onBuildingSelect) this.onBuildingSelect(ud.buildingData);
          return;
        }
        if(ud.type==='landmark'&&ud.name){
          if(this.onLandmarkSelect) this.onLandmarkSelect(ud.name);
          return;
        }
      }
    }
  }

  _onMouseMove(e) {
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    this.mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const intersects=this.raycaster.intersectObjects(this._getIntersectObjects(),false);
    if(this.hoveredObject){if(this.hoveredObject.material&&this.hoveredObject.userData.origColor!==undefined){this.hoveredObject.material.color.setHex(this.hoveredObject.userData.origColor);this.hoveredObject.userData.origColor=undefined;}this.hoveredObject=null;this.container.style.cursor='default';}
    if(intersects.length>0){const obj=intersects[0].object;if(obj.material&&obj.material.color){this.hoveredObject=obj;if(obj.userData.origColor===undefined)obj.userData.origColor=obj.material.color.getHex();obj.material.color.setHex(this._lighten(obj.userData.origColor,1.2));this.container.style.cursor='pointer';}}
  }

  _onResize() {
    const w=this.container.clientWidth,h=this.container.clientHeight;
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h);this.labelRenderer.setSize(w,h);
  }

  focusOnBuilding(buildingId) {
    const b=BUILDINGS.find(b=>b.id===buildingId);
    if(!b)return;
    const tp={x:b.x,y:b.h+15,z:b.z+25},tl={x:b.x,y:b.h/2,z:b.z};
    const sp={x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z};
    const sl={x:this.controls.target.x,y:this.controls.target.y,z:this.controls.target.z};
    const dur=1000,st=Date.now();
    const anim=()=>{
      const p=Math.min(1,(Date.now()-st)/dur);
      // iOS spring-like: easeOutBack
      const c1=1.70158, c3=c1+1;
      const ease=1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);
      this.camera.position.set(sp.x+(tp.x-sp.x)*ease,sp.y+(tp.y-sp.y)*ease,sp.z+(tp.z-sp.z)*ease);
      this.controls.target.set(sl.x+(tl.x-sl.x)*ease,sl.y+(tl.y-sl.y)*ease,sl.z+(tl.z-sl.z)*ease);
      if(p<1)requestAnimationFrame(anim);
    };
    anim();
  }

  _animate() {
    requestAnimationFrame(()=>this._animate());
    const time=Date.now()*0.001;
    if(this.waterSurface){const op=0.3+Math.sin(time*1.5)*0.1;this.waterSurface.material.opacity=op;this.waterSurface.position.y=0.12+Math.sin(time*0.8)*0.03;}

    // 呼吸光点动画
    if (this._pulseDots && this._pulseDots.length > 0) {
      this._pulseDots.forEach(dot => {
        const t = time * 1.8 + dot.userData.phase;
        const breathe = 0.5 + Math.sin(t) * 0.5; // 0~1 正弦波
        if (dot.userData.pulseType === 'core') {
          // 发光核心：缩放呼吸 + 上下微浮动
          dot.scale.setScalar(0.8 + breathe * 0.5);
          dot.material.emissiveIntensity = 0.3 + breathe * 0.4;
          dot.position.y = dot.userData.baseY + Math.sin(t * 0.7) * 0.25;
        } else if (dot.userData.pulseType === 'glow') {
          // 光晕：大范围缩放 + 透明度波动
          dot.scale.setScalar(0.9 + breathe * 0.9);
          dot.material.opacity = 0.12 + breathe * 0.3;
          dot.position.y = dot.userData.baseY + Math.sin(t * 0.7 + 0.3) * 0.2;
        }
      });
    }

    this.controls.update();
    this.renderer.render(this.scene,this.camera);
    this.labelRenderer.render(this.scene,this.camera);
  }

  // ═══ 进入建筑内部 ═══
  // onRoomSelect: (roomData, buildingData) => {} 回调
  onRoomSelect = null;

  enterBuilding(buildingData) {
    const rooms = BUILDING_ROOMS[buildingData.id];
    if (!rooms) return;

    // 保存当前外部相机状态
    this._extCameraPos = this.camera.position.clone();
    this._extTarget = this.controls.target.clone();

    // 隐藏外部场景
    this.externalGroup.visible = false;

    // 清空旧内部场景
    while(this.internalGroup.children.length > 0) {
      this.internalGroup.remove(this.internalGroup.children[0]);
    }

    // 建筑内部边界框（半透明）
    const maxFloor = Math.max(...rooms.map(r => r.floor));
    const innerH = maxFloor * 4; // 每层约4units
    const innerW = Math.max(...rooms.map(r => Math.abs(r.pos.x) + r.w/2)) * 2.5;
    const innerD = Math.max(...rooms.map(r => Math.abs(r.pos.z) + r.d/2)) * 2.5;

    // 地面
    const floorGeo = new THREE.PlaneGeometry(innerW + 4, innerD + 4);
    const floorMat = new THREE.MeshToonMaterial({ color: 0xe8e0d0, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.05, 0);
    floor.receiveShadow = true;
    this.internalGroup.add(floor);

    // 外框（半透明墙壁）
    const wallMat = new THREE.MeshToonMaterial({
      color: 0xcccccc,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide
    });
    // 四面墙
    [[0, 0, -innerD/2, innerW, innerH, 0.1, 0, 0], [0, 0, innerD/2, innerW, innerH, 0.1, 0, 0],
     [-innerW/2, 0, 0, 0.1, innerH, innerD, 0, 0], [innerW/2, 0, 0, 0.1, innerH, innerD, 0, 0]].forEach(([wx,wy,wz,ww,wh,wd]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), wallMat);
      wall.position.set(wx, wh/2, wz);
      this.internalGroup.add(wall);
    });

    // 楼层地板线
    for (let f = 1; f <= maxFloor; f++) {
      const lineGeo = new THREE.PlaneGeometry(innerW, innerD);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x999999, side: THREE.DoubleSide,
        transparent: true, opacity: 0.15
      });
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.y = f * 4 - 0.02;
      this.internalGroup.add(line);
    }

    // 房间方块
    const roomMeshes = [];
    rooms.forEach(room => {
      const rGeo = new THREE.BoxGeometry(room.w, room.h, room.d);
      const rMat = new THREE.MeshToonMaterial({
        color: room.color
      });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(room.pos.x, room.pos.y + room.h/2, room.pos.z);
      rMesh.castShadow = true;
      rMesh.receiveShadow = true;
      rMesh.userData = {
        type: 'room',
        roomData: room,
        buildingData: buildingData,
        origColor: room.color
      };
      this.internalGroup.add(rMesh);

      // 门（小方块贴房间正面）
      const doorGeo = new THREE.BoxGeometry(1.5, 2.2, 0.15);
      const doorMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(room.pos.x, room.pos.y + 1.1, room.pos.z + room.d/2 + 0.08);
      this.internalGroup.add(door);

      roomMeshes.push(rMesh);

      // CSS2D 标签
      const lDiv = document.createElement('div');
      lDiv.textContent = room.name;
      lDiv.style.cssText = 'background:rgba(0,0,0,0.75);color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;white-space:nowrap;pointer-events:none;';
      const lbl = new CSS2DObject(lDiv);
      lbl.position.set(room.pos.x, room.pos.y + room.h + 0.8, room.pos.z);
      this.internalGroup.add(lbl);
    });

    // 显示内部场景
    this.internalGroup.visible = true;

    // 保存房间 mesh 引用用于交互
    this._roomMeshes = roomMeshes;

    // ═══ 呼吸光点（被投诉房间标记）═══
    this._pulseDots = [];
    const activeComplaints = typeof Store !== 'undefined' ? Store.getActiveComplaintsByBuilding(buildingData.id) : {};
    rooms.forEach(room => {
      const cats = activeComplaints[room.id];
      if (!cats || cats.length === 0) return;
      // 投诉方向对应颜色
      const catColors = { hygiene: 0xf0a04b, safety: 0xe85d5d, other: 0x5b9bd5 };
      cats.forEach((cat, ci) => {
        const offsetX = cats.length === 1 ? 0 : (ci - (cats.length-1)/2) * 1.2;
        const basePos = { x: room.pos.x + offsetX, y: room.pos.y + room.h + 1.2, z: room.pos.z };
        const hexColor = catColors[cat] || 0xffffff;

        // 内层发光核心（Toon材质 + emissive）
        const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMat = new THREE.MeshToonMaterial({ color: hexColor, emissive: hexColor, emissiveIntensity: 0.5 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.copy(basePos);
        core.userData = { pulseType: 'core', baseY: basePos.y, phase: Math.random() * Math.PI * 2, category: cat };
        this.internalGroup.add(core);
        this._pulseDots.push(core);

        // 外层柔和光晕（半透明 Toon）
        const glowGeo = new THREE.SphereGeometry(0.65, 16, 16);
        const glowMat = new THREE.MeshToonMaterial({ color: hexColor, transparent: true, opacity: 0.3 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(basePos);
        glow.userData = { pulseType: 'glow', baseY: basePos.y, phase: core.userData.phase + 0.5 };
        this.internalGroup.add(glow);
        this._pulseDots.push(glow);
      });
    });

    // 相机动画：飞入建筑内部俯视
    const tp = { x: 0, y: innerH + 6, z: innerD/2 + 10 };
    const tl = { x: 0, y: innerH/2, z: 0 };
    const sp = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    const sl = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
    const dur = 800, st = Date.now();
    this.controls.minDistance = 5;
    this.controls.maxDistance = 80;
    const anim = () => {
      const p = Math.min(1, (Date.now() - st) / dur);
      const ease = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2;
      this.camera.position.set(sp.x + (tp.x - sp.x)*ease, sp.y + (tp.y - sp.y)*ease, sp.z + (tp.z - sp.z)*ease);
      this.controls.target.set(sl.x + (tl.x - sl.x)*ease, sl.y + (tl.y - sl.y)*ease, sl.z + (tl.z - sl.z)*ease);
      if (p < 1) requestAnimationFrame(anim);
    };
    anim();

    this._isInside = true;
    return true;
  }

  exitBuilding() {
    if (!this._isInside) return;

    // 清空内部场景（包括 CSS2D 标签）
    while(this.internalGroup.children.length > 0) {
      this.internalGroup.remove(this.internalGroup.children[0]);
    }
    this.internalGroup.visible = false;
    this._isInside = false;
    this._roomMeshes = null;

    // 恢复外部场景
    this.externalGroup.visible = true;

    // 相机动画：回到外部视角
    if (this._extCameraPos && this._extTarget) {
      const tp = this._extCameraPos;
      const tl = this._extTarget;
      const sp = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
      const sl = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
      const dur = 800, st = Date.now();
      this.controls.minDistance = 30;
      this.controls.maxDistance = 350;
      const anim = () => {
        const p = Math.min(1, (Date.now() - st) / dur);
        // iOS spring-like
      const c1=1.70158, c3=c1+1;
      const ease=1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2);
        this.camera.position.set(sp.x + (tp.x - sp.x)*ease, sp.y + (tp.y - sp.y)*ease, sp.z + (tp.z - sp.z)*ease);
        this.controls.target.set(sl.x + (tl.x - sl.x)*ease, sl.y + (tl.y - sl.y)*ease, sl.z + (tl.z - sl.z)*ease);
        if (p < 1) requestAnimationFrame(anim);
      };
      anim();
    }
  }

  // 覆盖射线检测以支持内部房间
  _getIntersectObjects() {
    if (this._isInside && this._roomMeshes) {
      return this._roomMeshes;
    }
    const objs = [];
    this.buildingMeshes.forEach(b => {
      if (b.mesh && b.mesh.visible) objs.push(b.mesh);
      if (b.roof && b.roof.visible) objs.push(b.roof);
    });
    if (this.bridgeGroup) { this.bridgeGroup.children.forEach(c => objs.push(c)); }
    return objs;
  }

  // 覆盖点击以支持内部房间
  _onClick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this._getIntersectObjects(), false);
    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        const ud = intersects[i].object.userData;
        if (this._isInside && ud.type === 'room' && ud.roomData) {
          if (this.onRoomSelect) this.onRoomSelect(ud.roomData, ud.buildingData);
          return;
        }
        if (ud.type === 'building' && ud.buildingData) {
          if (this.onBuildingSelect) this.onBuildingSelect(ud.buildingData);
          return;
        }
        if (ud.type === 'landmark' && ud.name) {
          if (this.onLandmarkSelect) this.onLandmarkSelect(ud.name);
          return;
        }
      }
    }
  }

  destroy() {
    if(this.renderer){this.container.removeChild(this.renderer.domElement);this.renderer.dispose();}
  }
}
