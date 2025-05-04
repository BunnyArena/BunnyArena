const content = document.getElementById('mainContent');

function setActiveNav(id) {
  document.querySelectorAll('.bottom-nav a').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(`nav-${id}`);
  if (target) target.classList.add('active');
}

function renderView(view) {
  setActiveNav(view);
  // Clear previous content
  content.innerHTML = '';

  switch (view) {
    case 'wallet':
      renderWallet();
      break;

    case 'profile':
      renderProfile();
      break;

    case 'joined':
      renderJoined();
      break;

    case 'mailbox':
      renderMailbox();
      break;

    default:
      renderHome();
      break;
  }
}

function renderHome() {
  const row = document.createElement('div');
  row.classList.add('row', 'g-3');

  const tournaments = [
    {
      name: 'Free Fire Max',
      detail: {
        mode: "BR casual",
        teamMode: "Solo"
      },
      tuid: '0123456789',
      date: '5 May, 2025 7:00 PM',
      entry: '₹10',
      prizePool: {
        perKill: "₹7",
        booyah: "₹10"
      },
      teamCount: '30/50',
      roomId: 'ABCD1234',
      password: 'xyz789',
      tags: ['Solo', 'TPP'],
      registered: false, // For testing whether user has registered
      registeredTime: '1m 30s' // Time left for registration
    }
  ];

  tournaments.forEach(t => {
    const col = document.createElement('div');
    col.classList.add('col-12');

    const card = document.createElement('div');
    card.classList.add('card', 'p-3', 'd-flex', 'flex-column', 'gap-2');

    // Header
    const header = document.createElement('div');
    header.classList.add('d-flex', 'justify-content-between', 'align-items-center');

    const title = document.createElement('h5');
    title.classList.add('m-0');
    title.innerText = t.name;
    header.appendChild(title);

    const tagWrap = document.createElement('div');
    t.tags.forEach(tag => {
      const tagBadge = document.createElement('span');
      tagBadge.classList.add('badge', 'bg-secondary', 'ms-1');
      tagBadge.innerText = tag;
      tagWrap.appendChild(tagBadge);
    });
    header.appendChild(tagWrap);
    card.appendChild(header);

    // Middle Row
    const midRow = document.createElement('div');
    midRow.classList.add('d-flex','flex-column', 'justify-content-between');

    const perKill = document.createElement('div');
    perKill.innerHTML = `<strong>Per Kill Prize:</strong> ${t.prizePool.perKill}`;
    
    const booyah = document.createElement('div');
    booyah.innerHTML = `<strong>Booyah Prize:</strong> ${t.prizePool.booyah}`;
    
    midRow.appendChild(perKill);
    midRow.appendChild(booyah);
    
    const teams = document.createElement('div');
    teams.innerHTML = `<strong>Teams Registered:</strong> ${t.teamCount}`;
    
    midRow.appendChild(teams);
    card.appendChild(midRow);

    // Bottom Action Row
    const actionRow = document.createElement('div');
    actionRow.classList.add('d-flex', 'justify-content-between', 'align-items-center');

    const timeInfo = document.createElement('small');
    timeInfo.classList.add('text-muted');
    timeInfo.innerText = `Match starts in ${getTimeRemaining(t.date)}`;
    card.appendChild(timeInfo);

    const buttonGroup = document.createElement('div');
    let joinBtn, detailBtn;

    // If not registered, show Register button with countdown
    if (!t.registered) {
      joinBtn = document.createElement('button');
      joinBtn.classList.add('btn', 'btn-primary', 'btn-sm', 'me-2');
      joinBtn.innerText = `Register (${t.registeredTime})`;
      joinBtn.disabled = false;  // Enable register button for testing
      
      detailBtn = document.createElement('button');
      detailBtn.classList.add('btn', 'btn-outline-light', 'btn-sm');
      detailBtn.innerText = 'Details';
    } else {
      joinBtn = document.createElement('button');
      joinBtn.classList.add('btn', 'btn-success', 'btn-sm', 'me-2');
      joinBtn.innerText = `Join Room (${t.registeredTime})`;
      joinBtn.disabled = false;  // Enable join room button for testing

      detailBtn = document.createElement('button');
      detailBtn.classList.add('btn', 'btn-outline-light', 'btn-sm');
      detailBtn.innerText = 'Details';
    }

    buttonGroup.appendChild(joinBtn);
    buttonGroup.appendChild(detailBtn);
    actionRow.appendChild(buttonGroup);
    card.appendChild(actionRow);

    // Room ID & Password
    if (t.roomId && t.password) {
      const roomInfo = document.createElement('div');
      roomInfo.classList.add('mt-2');
      roomInfo.innerHTML = `
        <small><strong>Room ID:</strong> <code>${t.roomId}</code> 
        <button class="btn btn-sm btn-outline-light btn-copy" data-clip="${t.roomId}">Copy</button></small><br>
        <small><strong>Password:</strong> <code>${t.password}</code> 
        <button class="btn btn-sm btn-outline-light btn-copy" data-clip="${t.password}">Copy</button></small>
      `;
      card.appendChild(roomInfo);
    }

    col.appendChild(card);
    row.appendChild(col);
  });

  content.appendChild(row);

  // Add copy-to-clipboard functionality
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-copy')) {
      navigator.clipboard.writeText(e.target.dataset.clip)
        .then(() => alert('Copied to clipboard!'))
        .catch(() => alert('Failed to copy!'));
    }
  });
}

function getTimeRemaining(startDate) {
  const now = new Date();
  const tournamentStart = new Date(startDate);

  if (tournamentStart - now > 0) {
    const hours = Math.floor((tournamentStart - now) / 3600000);
    const minutes = Math.floor(((tournamentStart - now) % 3600000) / 60000);
    const seconds = Math.floor(((tournamentStart - now) % 60000) / 1000);

    console.log(`Time Remaining: ${hours}h ${minutes}m ${seconds}s`);  // Debug info
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    console.log("Tournament has started!");  // Debug info
    return "Tournament has started!";
  }
}

// Usage example:
console.log(getTimeRemaining("May 5, 2025 19:00:00"));

// Set initial view
renderView('home');
