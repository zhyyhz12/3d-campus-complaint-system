"""
3D校园投诉系统 - AI 助手后端代理
启动方式: python3 server.py
环境变量: AI_API_URL, AI_API_KEY, AI_MODEL
"""
from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import json
import re

app = Flask(__name__, static_folder='.')

API_URL = os.environ.get('AI_API_URL', 'https://api.deepseek.com/v1/chat/completions')
API_KEY = os.environ.get('AI_API_KEY', 'sk-53cdae71911d40efa0cb17ff4bc061ee')
MODEL = os.environ.get('AI_MODEL', 'deepseek-chat')

SYSTEM_PROMPT = """你是青岛农业大学3D校园投诉系统的AI助手。

你的能力：
1. 帮助用户查找校园建筑位置（如"图书馆在哪""校医院怎么走"）
2. 引导用户提交投诉（建议选择哪个建筑和投诉方向）
3. 回答校园生活相关问题
4. 解释投诉系统如何使用

校园建筑包括：主楼、图书馆、教学楼A/B/C/D/E/F/G、美术馆、科技楼、化学楼、
生物楼、工程楼、文经楼、信息楼、学术会馆、润兴商城、润兴餐厅、博爱餐厅、
海都餐厅、西苑餐厅、西北餐厅、文体馆、五环体育场、公主楼、
东苑宿舍1-9号、西苑宿舍1-6号、校医院、专家楼。

投诉方向：
- 卫生问题（黄色标签）：环境卫生、垃圾处理、清洁相关
- 安全隐患（红色标签）：设施损坏、漏水、火灾风险、安全相关
- 其他（蓝色标签）：不属于以上两类的其他问题

回复要求：简洁友好，每次控制在200字以内。如用户询问位置，给出方位描述。
如用户想投诉，引导他点击地图上对应建筑进入内部选择房间后提交。"""


def fallback_analyze(content, category):
    """API不可用时的降级分析（关键词匹配）"""
    text = content.lower()
    urgency = 1
    reason = ''
    advice = ''

    # 紧迫度关键词
    if any(w in text for w in ['火灾', '漏电', '爆炸', '倒塌', '触电', '煤气', '天然气', '着火', '燃烧']):
        urgency = 5
        reason = '可能涉及电气线路老化、设备故障或可燃物管理不当，存在严重安全风险。'
        advice = '请立即远离危险区域并拨打119，同时通知校方安保人员疏散周边人员。'
    elif any(w in text for w in ['漏水', '漏雨', '裂缝', '掉落', '断裂', '砸', '坍塌', '坠落', '大面积']):
        urgency = 4
        reason = '可能由管道老化、建筑结构问题或天气原因导致，存在较大安全隐患。'
        advice = '请勿靠近该区域，用容器接水防止扩散，及时通知楼管人员紧急处理。'
    elif any(w in text for w in ['堵塞', '故障', '损坏', '停水', '停电', '断电', '停用', '失灵']):
        urgency = 3
        reason = '可能由设备老化、维护不及时或使用不当导致。'
        advice = '建议暂时使用备用设施，避免自行拆卸维修，等待专业人员处理。'
    elif any(w in text for w in ['脏', '臭', '垃圾', '噪音', '不干净', '异味', '发霉', '虫子']):
        urgency = 2
        reason = '可能由清洁频次不足、垃圾清运不及时或通风不良导致。'
        advice = '建议保持个人区域清洁，开窗通风，耐心等待保洁人员处理。'
    else:
        urgency = 1
        reason = '该问题可能由日常使用或管理流程导致，需要学校相关部门关注。'
        advice = '建议先观察一段时间，如问题持续存在可再次提交投诉反馈。'

    # 安全隐患方向自动提高紧迫度
    if category == 'safety':
        urgency = max(urgency, 3)

    return {'reason': reason, 'advice': advice, 'urgency': urgency}


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """AI投诉分析接口"""
    data = request.get_json()
    location = data.get('location', '')
    category = data.get('category', '')
    content = data.get('content', '')

    if not API_KEY:
        return jsonify(fallback_analyze(content, category))

    prompt = f"""请分析以下校园投诉，给出：
1. 可能的原因（1句话）
2. 学生当前可以采取的临时措施（1-2句话）
3. 紧迫度评级（1-5的整数）：1=不紧急，5=极度紧急（如漏电、火灾风险、人员受伤）

投诉地点：{location}
投诉方向：{category}
投诉内容：{content}

请严格用JSON格式回复，不要有其他文字：{{"reason":"原因","advice":"建议","urgency":数字}}"""

    try:
        resp = requests.post(
            API_URL,
            json={
                'model': MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.5,
                'max_tokens': 300
            },
            headers={'Authorization': f'Bearer {API_KEY}'},
            timeout=20
        )
        result = resp.json()
        text = result['choices'][0]['message']['content']

        # 尝试从回复中提取JSON
        json_match = re.search(r'\{[^}]+\}', text)
        if json_match:
            analysis = json.loads(json_match.group())
            analysis['urgency'] = int(analysis.get('urgency', 3))
            return jsonify(analysis)
        else:
            return jsonify(fallback_analyze(content, category))
    except Exception as e:
        print(f'AI分析失败: {e}')
        return jsonify(fallback_analyze(content, category))


@app.route('/api/chat', methods=['POST'])
def chat():
    if not API_KEY:
        return jsonify({
            'choices': [{'message': {
                'content': 'AI 助手尚未配置 API Key。请在启动时设置 AI_API_KEY 环境变量。'
            }}]
        })

    data = request.get_json()
    messages = data.get('messages', [])

    try:
        resp = requests.post(
            API_URL,
            json={
                'model': MODEL,
                'messages': [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
                'temperature': 0.7,
                'max_tokens': 500
            },
            headers={'Authorization': f'Bearer {API_KEY}'},
            timeout=30
        )
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({
            'choices': [{'message': {'content': f'AI 服务暂时不可用：{str(e)}'}}]
        })


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8765))
    print(f'  AI API: {API_URL}')
    print(f'  Model: {MODEL}')
    print(f'  Key: {"已配置" if API_KEY else "未配置（使用降级回复）"}')
    print(f'  服务地址: http://0.0.0.0:{port}')
    app.run(host='0.0.0.0', port=port)
