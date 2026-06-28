/**
 * AI 校园助手 - 前端对话逻辑（优化版）
 */
(function() {
  const aiMessages = [];

  function toggleAI() {
    const panel = document.getElementById('ai-panel');
    const wasVisible = panel.classList.contains('show');

    if (wasVisible) {
      // 关闭动画
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(16px) scale(0.96)';
      setTimeout(() => {
        panel.classList.remove('show');
        panel.style.opacity = '';
        panel.style.transform = '';
      }, 300);
    } else {
      panel.classList.add('show');
      setTimeout(() => document.getElementById('ai-input').focus(), 400);
      if (aiMessages.length === 0) {
        setTimeout(() => {
          addAIMessage('你好！我是校园AI助手 🤖\n\n可以问我：\n• "图书馆在哪里？"\n• "我想投诉食堂卫生"\n• "校医院怎么走？"');
        }, 200);
      }
    }
  }

  async function sendMessage() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = '';
    document.getElementById('ai-send').disabled = true;
    document.getElementById('ai-send').textContent = '...';

    // 显示思考中动画
    const thinking = showThinking();

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: aiMessages })
      });
      const data = await resp.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，暂时无法回复，请稍后再试。';
      removeThinking(thinking);
      addAIMessage(reply);
    } catch (e) {
      removeThinking(thinking);
      addAIMessage('网络错误，请稍后再试。');
    }

    document.getElementById('ai-send').disabled = false;
    document.getElementById('ai-send').textContent = '发送';
  }

  function showThinking() {
    const el = document.createElement('div');
    el.className = 'ai-thinking';
    el.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('ai-messages').appendChild(el);
    scrollDown();
    return el;
  }

  function removeThinking(el) {
    if (el && el.parentNode) el.remove();
  }

  function addUserMessage(text) {
    aiMessages.push({ role: 'user', content: text });
    const el = document.createElement('div');
    el.className = 'ai-msg ai-msg-user';
    el.textContent = text;
    document.getElementById('ai-messages').appendChild(el);
    scrollDown();
  }

  function addAIMessage(text) {
    aiMessages.push({ role: 'assistant', content: text });
    const el = document.createElement('div');
    el.className = 'ai-msg ai-msg-ai';
    el.textContent = text;
    document.getElementById('ai-messages').appendChild(el);
    scrollDown();
  }

  function scrollDown() {
    const msgs = document.getElementById('ai-messages');
    setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 120);
  }

  // 挂载到全局
  window.toggleAI = toggleAI;
  window.sendAIMessage = sendMessage;

  // 绑定回车发送
  document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('ai-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
    const btn = document.getElementById('ai-send');
    if (btn) {
      btn.addEventListener('click', sendMessage);
    }
  });
})();
