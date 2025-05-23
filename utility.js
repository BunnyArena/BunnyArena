//Global Variables
const navItems = document.querySelectorAll('.nav-item');
const indicator = document.querySelector('.indicator');
let lastActiveNav = navItems[2];
let admin_tc = document.getElementById("admin_tc");
let admin_rc = document.getElementById("admin_rc");
let admin_wc = document.getElementById("admin_wc");
let login_c = document.getElementById("login_c");
let signup_c = document.getElementById("signup_c");
let profile_c = document.getElementById("profile_c");
let help_c = document.getElementById("help_c");
let user_tc = document.getElementById("user_tc");
let user_wc = document.getElementById("user_wc");
let user_jc = document.getElementById("user_jc");
let user_mc = document.getElementById("user_mc");
let admin_nav = document.getElementById("admin_nav")
let user_nav = document.getElementById("main-nav")
let modal = document.getElementById("modal")
let user = JSON.parse(localStorage.getItem("user"))
let uid = user?.uid;
let role = user?.role || "user";
let token = user?.access_token;
let backend_root = "http://localhost:4000/api/";

//utility function
async function fetchProtected(route, options = {}) {
  let user = JSON.parse(localStorage.getItem("user"));
  if (!user?.access_token) throw new Error("No access token found");

  const url = backend_root + route;

  // Function to make a request with a given token
  const makeRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

  // First attempt
  let res = await makeRequest(user.access_token);

  // If unauthorized, try refresh
  if (res.status === 401) {
    const refreshedUser = await refreshAccessToken();
    if (!refreshedUser) {
      showAlert("Session expired", "error");
      throw new Error("Refresh failed");
  
    }

    // Retry with new token
    res = await makeRequest(refreshedUser.access_token);
    if (!res.ok) throw new Error("Retry after refresh failed");
  }

  return res;
}
async function refreshAccessToken() {
  try {
    const res = await fetch(backend_root+"auth/refresh", {
      method: "POST",
      credentials: "include", // Refresh uses cookies
    });

    if (!res.ok) return null;

    const json = await res.json();

    let updatedUser = JSON.parse(localStorage.getItem("user")) || {};
    updatedUser.access_token = json.accessToken;

    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  } catch (err) {
    showAlert("Refresh token error: " + err, "error");
    return null;
  }
}
function viewsToggle(current_view) {
  const views = [admin_tc, admin_rc, login_c, signup_c, user_tc, user_wc, user_mc, profile_c, help_c, user_jc, admin_wc];
  views.forEach(view => {
    if (view !== current_view) {
      view.classList.add("hidden");
    } else {
      view.classList.remove("hidden");
    }
  });
}
function moveIndicatorTo(item) {
  const itemRect = item.getBoundingClientRect();
  indicator.style.left = `${itemRect.left + itemRect.width / 2 - 15}px`; // Adjusted for half the indicator width
}
async function setActiveNav(id, al = true) {
  let item;
  if (al) {
    item = document.getElementById(id);
  } else {
    item = id
  }

  if (!item) return; // Prevent errors if item is null

  moveIndicatorTo(item);
  lastActiveNav = item;

  navItems.forEach(nav => nav.classList.remove('hover'));
  item.classList.add('hover');
}
function err(at, ex, strict=false){
  if(strict){
    throw new Error(`ERROR: On ${at}, ${ex}`)
  }else{
    console.error(`ERROR: On ${at}, ${ex}`)
  }
}
function formatRemaining(ms) {
  const totalSec = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const seconds = String(totalSec % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setupLiveCountdown({ startTime, update }) {
  const timer = setInterval(() => {
    const now = new Date();
    const done = update(now);
    if (done || now >= startTime) clearInterval(timer);
  }, 1000);
}

function updateJoinButtonState({
  cardObj,
  now,
  joinBtn,
  msg,
  isRegistered,
  isJoined,
  is_pending,
  onRegister,
  onJoin
}) {
  const startTime = new Date(cardObj.start_time);
  const regCloseTime = new Date(startTime.getTime() - 10* 60 * 1000);
  const joinOpenTime = new Date(startTime.getTime() - 10 * 60 * 1000);
  const joinCloseTime = new Date(startTime.getTime() - 3 * 60 * 1000);
  const maxTeams = cardObj.max_teams || 48;
  const currentTeams = cardObj.team_registered;

  if (currentTeams === maxTeams) {
    joinBtn.disabled = true;
    joinBtn.textContent = "Registration Full";
    joinBtn.style.background = "color-mix(in srgb, red 50%, white 50%)";
    msg.textContent = "No more slots available";
    return true;
  }

  if (!isRegistered) {
    if (now < regCloseTime) {
      msg.textContent = `Registration closes in (${formatRemaining(regCloseTime - now)})`;
      joinBtn.textContent = `Register (₹${cardObj.entry_fee})`;
      joinBtn.disabled = false;
      joinBtn.onclick = onRegister;
    } else {
      msg.textContent = "Registration Closed";
      joinBtn.textContent = "Registration Closed";
      joinBtn.disabled = true;
      joinBtn.style.background = "color-mix(in srgb, red 50%, white 50%)";
    }
  } else if (!isJoined && !is_pending) {
    if (now < joinOpenTime) {
      msg.textContent = `Joining starts in (${formatRemaining(joinOpenTime - now)})`;
      joinBtn.textContent = "Join";
      joinBtn.disabled = true;
    } else if (now < joinCloseTime) {
      msg.textContent = `Joining closes in (${formatRemaining(joinCloseTime - now)})`;
      joinBtn.textContent = "Join";
      joinBtn.disabled = false;
      joinBtn.onclick = onJoin;
    } else {
      msg.textContent = "Joining Closed";
      joinBtn.textContent = "Closed";
      joinBtn.disabled = true;
    }
  } else if (is_pending) {
    joinBtn.textContent = "Registration Pending";
    joinBtn.disabled = true;
    msg.textContent = "Please wait for verification";
  } else {
    joinBtn.textContent = "Joined";
    joinBtn.disabled = true;
    msg.textContent = "You're in!";
  }

  return false;
}
function getUser() {
  return fetchProtected(`user/${uid}`, {});
}
async function getTournamentList(){
  const res = await fetchProtected("tournament/list")
  return res.json()
}
async function testBackendConnection() {
  try {
    const response = await fetch(backend_root+'test', {
      method: 'GET'
    });

    const data = await response.json();
    console.log("Connection success:", data);
  } catch (error) {
    console.error("Connection failed:", error);
  }
}
function formatRemaining(ms) {
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}<sup>th</sup> ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'p.m' : 'a.m';
  return `${h}:${m} ${period}`;
}

function renderTCards(arr = [], tournament_container) {
  tournament_container.innerHTML = "";
  
  if (!Array.isArray(arr) || arr.length === 0) {
    const node = createElem("div", "No tournaments available now!", "card");
    tournament_container.appendChild(node);
    return;
  }
  
  const fragment = document.createDocumentFragment();
  const now = new Date(); // Get current time once
  
  arr.forEach(cardObj => {
    const card = document.createElement("div");
    card.className = "card";
    
    // Top
    const top = document.createElement("div");
    top.className = "flex";
    
    const h3 = document.createElement("h3");
    h3.textContent = cardObj.title || "Title not set";
    
    const tag_container = document.createElement("div");
    tag_container.className = "tags";
    (cardObj.tags || []).forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tag_container.appendChild(tagSpan);
    });
    
    top.append(h3, tag_container);
    
    // Middle
    const middle = document.createElement("div");
    middle.className = "middle flex";
    
    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `
      <small>Per kill prize: ${cardObj.prize_pool?.per_kill_reward || "not decided"}</small>
      <small>${(cardObj.prize_pool?.rank_reward || []).map((p, i) => `#${i + 1}/48 Prize: ₹${p}`).join('<br>')}</small>
    `;
    
    const right = document.createElement("div");
    right.className = "right";
    const timeTag = document.createElement("time");
    timeTag.dateTime = cardObj.start_time;
    timeTag.innerHTML = `${formatDate(cardObj.start_time)}<br>${formatTime(cardObj.start_time)}`;
    right.appendChild(timeTag);
    
    middle.append(left, right);
    
    // Bottom
    const bottom = document.createElement("div");
    bottom.className = "bottom flex";
    
    const joinBtn = document.createElement("button");
    const detailsBtn = document.createElement("button");
    joinBtn.type = detailsBtn.type = "button";
    detailsBtn.textContent = "Details";
    
    bottom.append(joinBtn, detailsBtn);
    
    const msg = document.createElement("p");
    msg.className = "msg";
    
    card.append(top, middle, bottom, msg);
    fragment.appendChild(card);
    
    // Fast Button Setup
    let isRegistered = false;
    let isJoined = false;
    let is_pending = false;
    
    // Immediate button state update (fast response)
    updateJoinButtonState({
      cardObj,
      now,
      joinBtn,
      msg,
      isRegistered,
      isJoined,
      is_pending,
      onRegister: () => {
        register(
          cardObj,
          () => {
            isRegistered = true;
            is_pending = true;
            showAlert("Registration Submitted!");
          },
          () => showAlert("Cancelled")
        );
      },
      onJoin: () => {
        isJoined = true;
        showAlert("Joined Successfully!");
      },
    });
    
    // Optional: Setup live countdown to update state later too
    setupLiveCountdown({
      startTime: new Date(cardObj.start_time),
      update: (now) =>
        updateJoinButtonState({
          cardObj,
          now,
          joinBtn,
          msg,
          isRegistered,
          isJoined,
          is_pending,
          onRegister: () => {
            register(
              cardObj,
              () => {
                isRegistered = true;
                is_pending = true;
                showAlert("Registration Submitted!");
              },
              () => showAlert("Cancelled")
            );
          },
          onJoin: () => {
            isJoined = true;
            showAlert("Joined Successfully!");
          },
        }),
    });
  });
  
  tournament_container.appendChild(fragment);
}
function renderJoinedTCards(joinedArr = [], container) {
  if (!Array.isArray(joinedArr) || joinedArr.length === 0) {
    let node = createElem("div", "No joined tournaments found.", "card");
    container.appendChild(node);
    return;
  }
  
  joinedArr.forEach(cardObj => {
    const card = document.createElement("div");
    card.classList.add("card");
    
    // Header
    const tag_container = document.createElement("div");
    tag_container.classList.add("tags");
    cardObj.tags?.forEach(tag => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tag_container.appendChild(tagSpan);
    });
    
    const top = document.createElement("div");
    top.className = "flex";
    const h3 = document.createElement("h3");
    h3.textContent = cardObj.title || "Untitled Tournament";
    top.appendChild(h3);
    top.appendChild(tag_container);
    
    const verification = cardObj.payment_verification;
    const middle = document.createElement("div");
    middle.className = "middle flex";
    
    const left = document.createElement("div");
    left.className = "left";
    left.innerHTML = `
      <small>Per kill prize: ${cardObj.prize_pool?.per_kill_reward || "not decided"}</small>
      <small>${cardObj.prize_pool?.rank_reward?.map((p, i) => `#${i + 1}/48 Prize: ₹${p}`).join('<br>') || "not decided"}</small>
    `;
    
    const right = document.createElement("div");
    right.className = "right";
    const timeTag = document.createElement("time");
    timeTag.dateTime = cardObj.start_time;
    timeTag.innerHTML = `${formatDate(cardObj.start_time)}<br>${formatTime(cardObj.start_time)}`;
    right.appendChild(timeTag);
    
    middle.appendChild(left);
    middle.appendChild(right);
    
    // Footer
    const bottom = document.createElement("div");
    bottom.className = "bottom flex";
    
    const joinBtn = document.createElement("button");
    const detailsBtn = document.createElement("button");
    joinBtn.type = detailsBtn.type = "button";
    detailsBtn.textContent = "Details";
    bottom.appendChild(joinBtn);
    bottom.appendChild(detailsBtn);
    
    const msg = document.createElement("p");
    msg.className = "msg";
    
    setupLiveCountdown({
  startTime: new Date(cardObj.start_time),
  update: (now) => {
    const verification = cardObj.payment_verification;
    const joinOpenTime = new Date(new Date(cardObj.start_time).getTime() - 10 * 60 * 1000);
    const joinCloseTime = new Date(new Date(cardObj.start_time).getTime() - 3 * 60 * 1000);
    
    if (verification === "pending") {
      msg.textContent = "Registration pending";
      joinBtn.textContent = "Registered";
      joinBtn.disabled = true;
    } else if (verification === "rejected") {
      msg.textContent = "Payment verification rejected";
      msg.style.color = "red";
      joinBtn.textContent = "Refund";
      joinBtn.disabled = false;
      joinBtn.onclick = () => showAlert("Requesting refund...");
    } else if (verification === "approved") {
      if (now < joinOpenTime) {
        msg.textContent = `Join starts in (${formatRemaining(joinOpenTime - now)})`;
        joinBtn.textContent = "Locked";
        joinBtn.disabled = true;
      } else if (now < joinCloseTime) {
        msg.textContent = `Joining closes in (${formatRemaining(joinCloseTime - now)})`;
        joinBtn.textContent = "Join Now";
        joinBtn.disabled = false;
        joinBtn.onclick = () => showRoomJoinModal(cardObj);
      } else {
        msg.textContent = "Joining closed";
        joinBtn.textContent = "Match Ended";
        joinBtn.disabled = true;
        joinBtn.style.background = "gray";
      }
    }
    
    return false;
  }
});
    
    card.appendChild(top);
    card.appendChild(middle);
    card.appendChild(bottom);
    card.appendChild(msg);
    container.appendChild(card);
  });
}
const createElem = (tag, text = '', className = '', id = '') => {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  if (id) el.id = id;
  return el;
};
function register(tournament){
  let {entry_fee, tags, id} = tournament;
  if(tags.includes("Solo")){
    showPrompt(`Confirm to pay ₹${parseInt(entry_fee)} as entry fee !`, async ()=>{
        const res = await fetchProtected("registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_leader: uid,
      tournament_id: id,
      payment_amt: entry_fee,
      team: [uid]
        })
      });

      const result = await res.json();

      if (!res.ok) return showAlert(result.message || "Registration failed.", "error");

      showAlert("Registered Successfully!", "success");
      modal.classList.add("hidden");
    }, ()=>{
      showAlert("Registration Cancelled by user")
    })
  }else{
    const max_member = tags.includes('Duo') ? 1 : 3;
    const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const modalHeader = document.createElement('div');
  modalHeader.classList.add('modal-header');

  const modalTitle = document.createElement('h2');
  modalTitle.textContent = 'Register';

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => modal.classList.add("hidden");

  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeBtn);

  const modalBody = document.createElement('div');
  modalBody.classList.add('modal-body');

  const form = document.createElement('form');
  form.id = 'registerForm';
  
  const memberSection = document.createElement('div');
  
    memberSection.innerHTML = `<strong>Team Members:</strong>`;
    memberSection.style.display = 'flex';
    memberSection.style.flexDirection = 'column';
    memberSection.style.gap = '0.5rem';

    const memberContainer = document.createElement('div');
    memberContainer.id = 'members';
    memberContainer.style.display = 'flex';
    memberContainer.style.flexDirection = 'column';
    memberContainer.style.gap = '0.5rem';

    const memberInputs = [];

    const addMemberBtn = document.createElement('button');
    addMemberBtn.type = 'button';
    addMemberBtn.textContent = 'Add Teammate';
    addMemberBtn.onclick = () => {
      if (memberInputs.length < max_member) {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'members';
        input.placeholder = 'Teammate UID';
        memberInputs.push(input);
        memberContainer.appendChild(input);
      }
      if (memberInputs.length >= max_member) {
        addMemberBtn.disabled = true;
      }
    };

    memberSection.appendChild(memberContainer);
    memberSection.appendChild(addMemberBtn);
  
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Register';

  form.appendChild(memberSection);
  form.appendChild(submitBtn);

  // Final submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    const team = [...form.querySelectorAll('input[name="members"]')]
      .map(i => i.value)
      .filter(Boolean);

    team.push(uid); // Assuming uid is globally available as the current user ID

    const registrationPayload = {
      team_leader: uid,
      tournament_id: id,
      payment_amt: entry_fee*(max_member+1),
      team: team
    };

    showSpinner();
    try {
      showPrompt(`Confirm to pay ₹${parseInt(entry_fee*(max_member+1))} as entry fee for your whole team!`,async ()=>{
        const res = await fetchProtected("registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationPayload)
      });

      const result = await res.json();

      if (!res.ok) return showAlert(result.message || "Registration failed.", "error");

      showAlert("Registered Successfully!", "success");
      modal.classList.add("hidden");
      },  ()=>{
      showAlert("Registration Cancelled by user")
    })
      
    } catch (err) {
      showAlert("Error: " + err.message, "error");
    } finally {
      hideSpinner();
    }
  };

  modalBody.appendChild(form);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  }
  
}
function showDepositModal() {
  let payment_ref = "", payment_amt = 0, screenshotUploaded = false;
  const modal = document.createElement('div');
  modal.classList.add('modal');

  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const modalHeader = document.createElement('div');
  modalHeader.classList.add('modal-header');

  const modalTitle = document.createElement('h2');
  modalTitle.textContent = 'Register';

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => modal.classList.add("hidden");

  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeBtn);

  const modalBody = document.createElement('div');
  modalBody.classList.add('modal-body');

  const form = document.createElement('form');
  form.id = 'depositForm';

  // QR + Screenshot upload section
  const qrCard = document.createElement('div');
  qrCard.classList.add('qr-card');

  const qrImg = document.createElement('img');
  qrImg.src = '/UPI_QR.png';
  qrImg.alt = 'UPI QR';
  qrImg.classList.add('qr-img');
  qrImg.style.cursor = 'pointer';
  qrImg.onclick = () => {
    window.open(`upi://pay?pa=9395985348@postbank&pn=Bunny Arena&cu=INR&am=0`, "_blank");
  };

  const scanText = document.createElement('p');
  scanText.innerHTML = '<strong>Scan or click to Pay</strong>';

  const upiText = document.createElement('p');
  upiText.innerHTML = 'UPI ID: <span class="upi-id" id="upi-id">9395985348@postbank</span>';
  upiText.style.cursor = "pointer";
  upiText.onclick = () => {
    navigator.clipboard.writeText("9395985348@postbank");
    showAlert("UPI ID copied!", "success");
  };

  const label = document.createElement('label');
  label.textContent = 'Submit screenshot proof for payment';

  const ocrInput = document.createElement('input');
  ocrInput.type = 'file';
  ocrInput.accept = 'image/*';
  ocrInput.id = 'ocr-input';

  

  qrCard.appendChild(qrImg);
  qrCard.appendChild(scanText);
  qrCard.appendChild(upiText);
  qrCard.appendChild(label);
  

  // Payment info inputs
  const upiIdInput = document.createElement('input');
  upiIdInput.type = 'text';
  upiIdInput.name = 'upi_id';
  upiIdInput.step = '0.01';
  upiIdInput.value = user.upi_id || ""
  upiIdInput.placeholder = 'Enter your upi id';
  upiIdInput.required = true;
  upiIdInput.id = 'upi_id';

  const paymentRefInput = document.createElement('input');
  paymentRefInput.type = 'text';
  paymentRefInput.name = 'payment_ref';
  paymentRefInput.placeholder = 'Payment Reference';
  paymentRefInput.required = true;
  paymentRefInput.id = 'payment-ref';

  const amountPaidInput = document.createElement('input');
  amountPaidInput.type = 'number';
  amountPaidInput.name = 'deposit_amount';
  amountPaidInput.step = '0.01';
  amountPaidInput.placeholder = 'Deposit Amount';
  amountPaidInput.required = true;
  amountPaidInput.id = 'deposit_amount';

ocrInput.onchange = async () => {
    const file = ocrInput.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("screenshot", file);

    try {
      showSpinner("Please wait...");
      const res = await fetchProtected("ocr", {
        method: "POST",
        body: fd,
      });

      const result = await res.json();
      paymentRefInput.value = result.extracted.utr || "";
      screenshotUploaded = true;

      showAlert("OCR Completed. Payment info updated.", "success");
    } catch (err) {
      console.error("OCR failed:", err);
      showAlert("OCR failed. Please try again.\n"+err, "error");
    } finally {
      hideSpinner();
    }
  };
  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Register';
form.appendChild(amountPaidInput);
  form.appendChild(qrCard);
  form.appendChild(ocrInput);
  form.appendChild(upiIdInput)
  form.appendChild(paymentRefInput);
  
  
  form.appendChild(submitBtn);
amountPaidInput.addEventListener("change",()=>{
  qrImg.onclick = () => {
    window.open(`upi://pay?pa=9395985348@postbank&pn=Bunny Arena&cu=INR&am=${parseInt(amountPaidInput.value)}`, "_blank");
  };
})
  // Final submission
  form.onsubmit = async (e) => {
    e.preventDefault();

  if (!screenshotUploaded) {
    return showAlert("Please upload a valid payment screenshot first.", "error");
  }

  showPrompt("Confirm the given payment details is correct",async ()=>{
    const data = new FormData(form);
    const formDataEntries = Object.fromEntries(data.entries());

    const depositPayload = {
      ref_id: formDataEntries.payment_ref,
      amount: parseInt(formDataEntries.deposit_amount),
      upi_id: formDataEntries.upi_id
    };

    showSpinner();
    try {
      const res = await fetchProtected("wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositPayload)
      });

      const result = await res.json();

      if (!res.ok) return showAlert(result.message || "failed.", "error");

      showAlert("Deposited Successfully!", "success");
      modal.classList.add("hidden");
    } catch (err) {
      showAlert("Error: " + err.message, "error");
    } finally {
      hideSpinner();
    }
  },()=>{
    showDepositModal()
  })

    
  };

  modalBody.appendChild(form);
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
}
async function showRoomJoinModal(cardObj) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.textContent = 'Match Room Details';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => modal.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'modal-body';
  
  let res = await fetchProtected(`${cardObj.tournament_id}/room-info`)
  let json = await res.json();
  
  body.innerHTML = `
    <p><strong>Room ID:</strong> ${json.data.room_id || "TBA"}</p>
    <p><strong>Password:</strong> ${json.fata.room_pass || "TBA"}</p>
    <p><strong>Match Time:</strong> ${formatDate(cardObj.start_time)} ${formatTime(cardObj.start_time)}</p>
    <p style="color:gray; font-size:0.9em;">Note: Room details are confidential. Do not share.</p>
  `;

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn';
  confirmBtn.textContent = 'Got it!';
  confirmBtn.onclick = () => modal.remove();

  footer.appendChild(confirmBtn);
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}
async function renderTransactionHistory(user_wc) {
  const res = await fetchProtected('transaction');
  const data = await res.json();

  const container = document.createElement('div');
  container.className = 'accordion-container';

  const header = document.createElement("h3");
  header.textContent = "Transaction History";
  container.appendChild(header);

  if (!data.transactions?.length) {
    const empty = document.createElement('p');
    empty.textContent = "No transactions found.";
    container.appendChild(empty);
    help_c.appendChild(container);
    return;
  }

  data.transactions.forEach((tx, index) => {
    const card = document.createElement('div');
    card.className = 'accordion-card';

    const cardHeader = document.createElement('button');
    cardHeader.className = 'accordion-header';
    cardHeader.setAttribute('aria-expanded', 'false');

    const info = document.createElement('div');
    info.className = 'transaction-summary';

    const isPositive = ["deposit", "credit", "reward"].some(type => tx.type.toLowerCase().includes(type));
    const amountClass = isPositive ? 'positive' : 'negative';
    if(!isPositive){
      tx.amount = `-₹${Math.abs(tx.amount)}`
    }else{
      tx.amount = `+${Math.abs(tx.amount)}₹`
    }
    info.innerHTML = `
      <div class="summary-left flex">
        <div class="tx-date">${new Date(tx.created_at).toLocaleDateString()}</div>
        <div class="tx-type">${tx.type}</div>
      </div>
      <div class="summary-right ${amountClass}">
        ${tx.amount}
      </div>
    `;

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined icon';
    icon.textContent = 'chevron_right';

    cardHeader.appendChild(info);
    cardHeader.appendChild(icon);

    const cardBody = document.createElement('div');
    cardBody.className = 'accordion-body flex-col';
    cardBody.style.display = 'none';
    cardBody.innerHTML = `
      <div><strong>Status:</strong> ${tx.status}</div>
      <div><strong>Description:</strong> ${tx.description || '—'}</div>
      <div><strong>Ref ID:</strong> ${tx.ref_id || '—'}</div>
      <div><strong>UPI ID:</strong> ${tx.upi_id || '—'}</div>
    `;

    cardHeader.onclick = () => {
      const expanded = cardHeader.getAttribute('aria-expanded') === 'true';
      icon.classList.toggle('rotated', !expanded);
      cardHeader.setAttribute('aria-expanded', !expanded);
      cardBody.style.display = expanded ? 'none' : 'block';
    };

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    container.appendChild(card);
  });

  user_wc.appendChild(container);
}
async function renderHelp() {
  viewsToggle(help_c)
  setActiveNav("nav-help")
  help_c.innerHTML = ""; // Clear the container

  const faqData = {
    general: [
      {
        question: "What is Bunny Arena?",
        answer: "Bunny Arena is an online platform that hosts competitive game tournaments where users can participate and win real rewards."
      },
      {
        question: "How do I join a tournament?",
        answer: "Sign up or log in to your account, navigate to the 'Tournaments' section, and tap 'Join' on any active tournament."
      }
    ],
    rules: [
      {
        question: "What are the basic rules for participating?",
        answer: "Participants must use their own accounts, not exploit glitches, and must join matches before the start time. Any form of cheating leads to immediate disqualification."
      },
      {
        question: "Can I rejoin a tournament if disconnected?",
        answer: "You may rejoin if the match is still ongoing. Repeated disconnections may affect your eligibility."
      }
    ],
    punishments: [
      {
        question: "What happens if I use cheats or hacks?",
        answer: "Immediate account suspension and permanent ban from Bunny Arena."
      },
      {
        question: "Is abusive behavior punished?",
        answer: "Yes. Toxic language, spamming, or threats result in temporary or permanent bans."
      }
    ],
    payments: [
      {
        question: "How do I withdraw my winnings?",
        answer: "Navigate to the 'Wallet' section, click 'Withdraw', and follow the steps to transfer funds to your UPI or bank account."
      },
      {
        question: "Are there any fees for joining tournaments?",
        answer: "Some tournaments are free, while others require an entry fee, which is clearly mentioned on the tournament card."
      },
      {
        question: "How long does it take to process withdrawals?",
        answer: "Withdrawals are processed within 24–48 hours on business days."
      }
    ]
  };

  const container = document.createElement('div');
  container.className = 'accordion-container';
  let header = document.createElement("h3");
  header.textContent = "FAQs"
  
  container.appendChild(header)
  
  let catIndex = 0;
  for (const [category, faqs] of Object.entries(faqData)) {
    const card = document.createElement('div');
    card.className = 'accordion-card';

    const cardHeader = document.createElement('button');
    cardHeader.className = 'accordion-header';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined icon';
    icon.textContent = 'chevron_right';
    cardHeader.innerHTML = `${category.toUpperCase()} `;
    cardHeader.appendChild(icon);
    cardHeader.setAttribute('aria-expanded', 'false');

    const cardBody = document.createElement('div');
    cardBody.className = 'accordion-body';
    cardBody.style.display = 'none';

    cardHeader.onclick = () => {
      const expanded = cardHeader.getAttribute('aria-expanded') === 'true';
      icon.classList.toggle('rotated', !expanded);
      cardHeader.setAttribute('aria-expanded', !expanded);
      cardBody.style.display = expanded ? 'none' : 'block';
    };

    faqs.forEach(faq => {
      const questionBtn = document.createElement('button');
      questionBtn.className = 'faq-question';
      questionBtn.setAttribute('aria-expanded', 'false');

      const qText = document.createElement('span');
      qText.textContent = faq.question;

      const qIcon = document.createElement('span');
      qIcon.className = 'material-symbols-outlined icon';
      qIcon.textContent = 'chevron_right';

      questionBtn.appendChild(qText);
      questionBtn.appendChild(qIcon);

      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      answer.textContent = faq.answer;
      answer.style.display = 'none';

      questionBtn.onclick = () => {
        const expanded = questionBtn.getAttribute('aria-expanded') === 'true';
        qIcon.classList.toggle('rotated', !expanded);
        questionBtn.setAttribute('aria-expanded', !expanded);
        answer.style.display = expanded ? 'none' : 'block';
      };

      cardBody.appendChild(questionBtn);
      cardBody.appendChild(answer);
    });

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    
    container.appendChild(card);

    catIndex++;
  }

  help_c.appendChild(container);
}

async function renderAdminL(nav, view, route, body={}) {
  renderAdminNav()
  setActiveNav(nav)
  viewsToggle(view);
  const table = view.querySelector(".styled-table");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  thead.innerHTML = "";

  let tournaments = [];

  try {
    showSpinner("Fetching tournament details...")
    let res= await fetchProtected(route, body);
    let json = await res.json()
    if(nav == "nav-registrations"){
      tournaments = json.data
    }else{
      tournaments = json
    }
  } catch (e) {
    err(`renderAdminL() ${nav}`, "failed to fetch", true);
  } finally {
    hideSpinner()
  }

  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 100;
    cell.textContent = "No tournaments found.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  // Header generation
  const sample = tournaments[0];
  const headers = Object.keys(sample);
  const headerRow = document.createElement("tr");
  headers.forEach(key => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });
  const actionTh = document.createElement("th");
  actionTh.textContent = "Actions";
  headerRow.appendChild(actionTh);
  thead.appendChild(headerRow);

  // Render rows
  tournaments.forEach((t, index) => {
    const row = document.createElement("tr");

    headers.forEach(key => {
      const td = document.createElement("td");
      let val = t[key];

      if (key === "start_time" && val) {
        const date = new Date(val);
        val = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (typeof val === "object" && val !== null) {
        val = JSON.stringify(val);
      }

      val = val ?? "-";

      td.textContent = val;
      td.setAttribute("contenteditable", true);
      td.setAttribute("data-key", key);
      td.setAttribute("data-original", val);
      row.appendChild(td);
    });

    const actionTd = document.createElement("td");
    actionTd.className = "actions";
    if(nav == "nav_tournaments"){
      actionTd.innerHTML = `
      <button onclick="toggleEdit(this, ${index})" class="success btn">Edit</button>
      <button onclick="deleteTournament('${t.id}')" class="danger btn">Delete</button>
    `;
    }else if (nav == "nav-wallet"){
      const id = encodeURIComponent(t.transaction_id);
actionTd.innerHTML = `
  <button class="btn success" onclick="setStatus('${id}', 'approved')">Approve</button>
  <button class="btn danger" onclick="setStatus('${id}', 'rejected')">Reject</button>
`;
    }else{
      const id = encodeURIComponent(t.reg_id);
      actionTd.innerHTML= `
  <button class="btn success" onclick="setRegStatus('${id}', 'approved')">Approve</button>
  <button class="btn danger" onclick="setRegStatus('${id}', 'rejected')">Reject</button>
`;
    }
    
    row.appendChild(actionTd);

    tbody.appendChild(row);
  });
}

async function renderAdminT(){
  await renderAdminL("nav_tournaments", admin_tc, "tournament/list")
}
async function renderAdminReg(){
  await renderAdminL("nav-registrations", admin_rc, "registrations/list")
}
async function renderAdminWlt(){
  await renderAdminL("nav-wallet", admin_wc, "wallet/deposit-requests")
}

//admin utility 
function renderAdminNav(){
  
  admin_nav.classList.remove("hidden")
  user_nav.classList.add("hidden")
  navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    setActiveNav(item, false)
  });
});
}
async function updateTournament(updated) {
  try {
    const res = await fetchProtected('tournament', {
      method: 'PATCH',
      headers: {
  "Content-Type": "application/json"
},
      body: JSON.stringify(updated)
    });

    if (!res.ok) throw new Error("Failed to update tournament");
    const data = res.json() 
    console.log("Tournament updated:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}
async function deleteTournament(id) {
  showPrompt("Are you sure you want to delete this tournament?", async()=>{
    try {
      showSpinner()
    const res = await fetchProtected(`tournament/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete tournament");

    renderAdminT()
  } catch (err) {
    console.log("Error: " + err.message);
  } finally {
    hideSpinner()
  }
  })
  
}
async function getRegistrationList(){
  const res = await fetchProtected("/registrations/list", {})
  return res
}
async function setRegStatus(reg_id, status) {
  try {
    const res = await fetchProtected(`registrations/${status}/${reg_id}`, {
      method: "PATCH"
    });

    const data = await res.json();

    if (res.ok) {
      showAlert(`Registration ${status} successfully`, "success");
      // Optionally reload the list or UI
    } else {
      showAlert(data.error || `Failed to ${status} registration`, "error");
    }
  } catch (err) {
    showAlert("Network error: " + err.message, "error");
  }
}
async function setStatus(id, status, description="") {
  try {
    showSpinner()
    const res = await fetchProtected(`transaction/${id}/status`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    status: status,
    description: description
  })
});

    const data = await res.json();

    if (res.ok) {
      showAlert(`Payment ${status} successfully`, "success");
      // Optionally reload the list or UI
    } else {
      showAlert(data.error || `Failed to ${status} payment`, "error");
    }
  } catch (err) {
    showAlert("Network error: " + err.message, "error");
  } finally {
    hideSpinner()
    renderAdminWlt()
  }
}
function showSpinner(msg = "Please wait...") {
  const spinner_c = document.querySelector("#spinner_c");
  const msgBox = document.querySelector("#spinner_msg");
  spinner_c.classList.remove("hidden");
  msgBox.textContent = msg;
}
function hideSpinner() {
  const spinner_c = document.querySelector("#spinner_c");
  spinner_c.classList.add("hidden");
}
function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}
function setupPullToRefresh(callback) {
  let startY = 0;
  let pulling = false;
  const threshold = 30;
  
  // Create invisible container
  const invisiblePullZone = document.getElementById('header');

  document.body.appendChild(invisiblePullZone);
  
  invisiblePullZone.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });
  
  invisiblePullZone.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) e.preventDefault(); // prevent default scroll
  }, { passive: false });
  
  invisiblePullZone.addEventListener('touchend', async (e) => {
    if (!pulling) return;
    pulling = false;
    
    const deltaY = e.changedTouches[0].clientY - startY;
    if (deltaY >= threshold) {
      await callback();
    }
  });
}
function updateThemeIcon(theme) {
  const icon = document.querySelector("#themeToggle span");
  icon.textContent = theme === "dark" ? "dark_mode" : "light_mode";
}
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.classList.add('modal');

  const alertContent = document.createElement('div');
  alertContent.classList.add('modal-content');

  const alertHeader = document.createElement('div');
  alertHeader.classList.add('modal-header');

  const alertTitle = document.createElement('h2');
  alertTitle.textContent = {
    info: 'Notice',
    success: 'Success',
    warning: 'Warning',
    error: 'Error'
  }[type] || 'Alert';

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => alert.remove();

  alertHeader.appendChild(alertTitle);
  alertHeader.appendChild(closeBtn);

  const alertBody = document.createElement('div');
  alertBody.classList.add('modal-body');
  alertBody.textContent = message;

  // Apply background color for type
  const typeColors = {
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#ff9800',
    error: '#f44336'
  };
  alertContent.style.border = `2px solid ${typeColors[type] || '#2196F3'}`;

  alertContent.appendChild(alertHeader);
  alertContent.appendChild(alertBody);
  alert.appendChild(alertContent);
  document.body.appendChild(alert);

  setTimeout(() => {
    alert.remove();
  }, 5000);
}
function showPrompt(message, onConfirm, onCancel) {
  const prompt = document.createElement('div');
  prompt.classList.add('modal');

  const promptContent = document.createElement('div');
  promptContent.classList.add('modal-content');

  const promptHeader = document.createElement('div');
  promptHeader.classList.add('modal-header');

  const promptTitle = document.createElement('h2');
  promptTitle.textContent = 'Confirmation';

  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close-btn');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => {
    prompt.remove();
    if (onCancel) onCancel();
  };

  promptHeader.appendChild(promptTitle);
  promptHeader.appendChild(closeBtn);

  const promptBody = document.createElement('div');
  promptBody.classList.add('modal-body');
  promptBody.textContent = message;

  const promptFooter = document.createElement('div');
  promptFooter.classList.add('modal-footer');

  const confirmBtn = createElem('button', "Confirm", "confirm");
  confirmBtn.onclick = () => {
    prompt.remove();
    onConfirm();
  };

  const cancelBtn = createElem('button', "Cancel", "cancel");
  cancelBtn.onclick = () => {
    prompt.remove();
    if (onCancel) onCancel();
  };

  promptFooter.appendChild(confirmBtn);
  promptFooter.appendChild(cancelBtn);

  promptContent.appendChild(promptHeader);
  promptContent.appendChild(promptBody);
  promptContent.appendChild(promptFooter);

  prompt.appendChild(promptContent);
  document.body.appendChild(prompt);
}
function navigateTo(path, onlyP=false) {
  const routes = {
  '/': renderHome,
  '/index.html': renderHome,
  '/wallet': renderWallet,
  '/mail': renderMail,
  '/profile': renderProfile,
  '/help': renderHelp,
  '/joined': renderJoined,
  '/tournament_manager': renderAdminT,
  '/registrations_manager': renderAdminReg,
  '/transaction_manager': renderAdminWlt,
};
  history.pushState({},"", path);
  const routeFn = routes[path] || routes['/index.html'];
  if(!onlyP){
    routeFn();
  }
   
}
function refresh(){
  navigateTo(window.location.pathname)
}