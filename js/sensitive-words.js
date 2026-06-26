/**
 * 敏感词过滤模块 - 通用校园敏感词库
 * 涵盖：脏话辱骂、涉政敏感、暴恐、色情低俗、违规广告等
 */

const SENSITIVE_WORDS = [
  // 脏话 / 辱骂
  '操你', '草泥马', '傻逼', '牛逼', '尼玛', '他妈的', '你妈', '去死', '滚蛋',
  '废物', '垃圾人', '贱人', '婊子', '王八蛋', '狗日的', '妈的', '混蛋', '神经病',
  '白痴', '脑残', '智障', '弱智', '猪头', '下贱', '无耻', '不要脸', '去你妈',
  '滚开', '吃屎', '放屁', '扯淡', '狗屎', '烂人', '人渣', '败类', '畜生',

  // 涉政敏感（基础集合）
  '法轮功', '六四', '天安门事件', '反共', '颠覆政权', '分裂国家', '台独', '港独',
  '藏独', '疆独', '反华', '辱华', '达赖', '邪教',

  // 暴力 / 恐怖
  '炸弹', '爆炸物', '杀光', '灭族', '恐怖袭击', '极端组织', '自杀攻击',
  '砍人', '捅人', '投毒', '下毒', '绑架', '勒索',

  // 色情 / 低俗
  '黄色网站', '裸聊', '色情', '嫖娼', '卖淫', '援交', '一夜情', '约炮',
  'av女优', '黄色视频', '裸照', '走光',

  // 违规 / 不当言论
  '代写论文', '替考', '作弊器', '考试答案', '代考', '买卖学位',
  '传销', '集资诈骗', '毒品', '吸毒', '贩毒', '大麻', '冰毒', '摇头丸',
  '赌博', '博彩', '私彩', '高利贷', '裸贷',

  // 人身攻击补充
  '死全家', '全家死光', '断子绝孙', '不得好死', '入土为安'
];

/**
 * 敏感词检测
 * @param {string} text 待检测文本
 * @returns {{passed: boolean, words: string[], message: string}}
 */
function checkSensitive(text) {
  if (!text || typeof text !== 'string') {
    return { passed: true, words: [], message: '' };
  }
  const lower = text.toLowerCase();
  const found = [];

  for (const word of SENSITIVE_WORDS) {
    if (lower.includes(word.toLowerCase())) {
      found.push(word);
    }
  }

  if (found.length > 0) {
    // 脱敏显示命中的词
    const masked = found.map(w => w[0] + '*'.repeat(Math.max(1, w.length - 1)));
    return {
      passed: false,
      words: found,
      message: `投诉内容包含敏感词：${masked.join('、')}，请修改后重新提交`
    };
  }

  return { passed: true, words: [], message: '' };
}
