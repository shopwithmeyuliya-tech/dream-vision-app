const apiBase = '/api';

const dreamForm = document.getElementById('dreamForm');
const dreamFeed = document.getElementById('dreamFeed');
const insightList = document.getElementById('insightList');
const communityMessage = document.getElementById('communityMessage');
const similarDreams = document.getElementById('similarDreams');

async function fetchData(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }

  return response.json();
}

function renderInsights(data) {
  if (!data?.topThemes?.length) {
    insightList.innerHTML = '<li class="trend-item"><span class="trend-tag">No themes yet</span></li>';
    return;
  }

  communityMessage.textContent = data.communityMessage;
  insightList.innerHTML = data.topThemes
    .map(
      item => `
        <li class="trend-item">
          <span class="trend-tag">${item.theme}</span>
          <span class="count-pill">${item.count}</span>
        </li>
      `
    )
    .join('');
}

function renderSimilarDreams(items) {
  if (!items?.length) {
    similarDreams.innerHTML = '<div class="similar-item"><span>No matches yet.</span></div>';
    return;
  }

  similarDreams.innerHTML = items
    .map(
      item => `
        <div class="similar-item">
          <div>
            <strong>${item.title}</strong>
            <div class="tag-list">
              ${item.analysis.themes.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </div>
          <span class="count-pill">${item.similarity}%</span>
        </div>
      `
    )
    .join('');
}

function renderFeed(dreams) {
  if (!dreams.length) {
    dreamFeed.innerHTML = '<div class="dream-card"><p class="dream-content">No dreams yet. Share the first one.</p></div>';
    return;
  }

  dreamFeed.innerHTML = dreams
    .map(
      dream => `
        <article class="dream-card">
          <div class="dream-head">
            <h3 class="dream-title">${dream.title}</h3>
            <span class="mood-badge">${dream.mood || 'curious'}</span>
          </div>

          <p class="dream-content">${dream.content}</p>

          <div class="tag-list">
            ${(dream.analysis?.themes || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            ${(dream.analysis?.emotions || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>

          <div class="lesson-box">${dream.analysis?.lesson || 'A story of reflection and growth.'}</div>

          <div class="meta-row">
            <span>${new Date(dream.createdAt).toLocaleDateString()}</span>
            <span>${dream.privacy}</span>
          </div>

          <div class="comment-list">
            ${(dream.comments || []).map(comment => `
              <div class="comment-item"><strong>${comment.user}:</strong> ${comment.text}</div>
            `).join('')}
          </div>

          <form class="comment-form" data-dream-id="${dream.id}">
            <input type="text" placeholder="Leave a reflection..." name="comment" required />
            <button class="primary-button" type="submit">Comment</button>
          </form>

          <div class="comment-form" style="margin-top: 10px;">
            <button class="secondary-button" data-similar="${dream.id}" type="button">Find similar dreams</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('.comment-form[data-dream-id]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const dreamId = form.dataset.dreamId;
      const input = form.querySelector('input[name="comment"]');
      const text = input.value.trim();
      if (!text) return;

      try {
        await fetchData(`${apiBase}/dreams/${dreamId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ user: 'You', text })
        });
        input.value = '';
        loadAll();
      } catch (error) {
        console.error(error);
      }
    });
  });

  document.querySelectorAll('[data-similar]').forEach(button => {
    button.addEventListener('click', async () => {
      const dreamId = button.dataset.similar;
      try {
        const data = await fetchData(`${apiBase}/dreams/${dreamId}/similar`);
        renderSimilarDreams(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error(error);
      }
    });
  });
}

async function loadAll() {
  try {
    const [dreams, insights] = await Promise.all([
      fetchData(`${apiBase}/dreams`),
      fetchData(`${apiBase}/insights`)
    ]);

    renderFeed(dreams);
    renderInsights(insights);

    if (dreams.length) {
      const firstDream = dreams[0];
      const similar = await fetchData(`${apiBase}/dreams/${firstDream.id}/similar`);
      renderSimilarDreams(similar);
    }
  } catch (error) {
    console.error(error);
  }
}

dreamForm.addEventListener('submit', async event => {
  event.preventDefault();

  const title = document.getElementById('dreamTitle').value.trim();
  const content = document.getElementById('dreamContent').value.trim();
  const privacy = document.getElementById('dreamPrivacy').value;

  if (!content) {
    alert('Please write your dream story first.');
    return;
  }

  try {
    await fetchData(`${apiBase}/dreams`, {
      method: 'POST',
      body: JSON.stringify({ title, content, privacy })
    });

    dreamForm.reset();
    await loadAll();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});

document.getElementById('focusFormButton').addEventListener('click', () => {
  document.getElementById('dreamFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('scrollFeedButton').addEventListener('click', () => {
  document.getElementById('feedSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

loadAll();
