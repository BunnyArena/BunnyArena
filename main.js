//not decided 
async function logout() {
  await fetch(backend_root+"/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  localStorage.removeItem("user");
  renderLogin()
}

//user render functions incomplete 
async function renderHome() {
  setActiveNav("nav_home")
  let tournaments;
  user_tc.innerHTML = '';
  viewsToggle(user_tc)
  user_tc.appendChild(createElem("h3", "Tournament List"));
  try{
    showSpinner("Loading tournament details...")
    tournaments = await getTournamentList();
  }catch{
    showAlert("Something went wrong!\nLogin again to continue!", "error")
    renderLogin()
  } finally {
    hideSpinner()
  }
  
  renderTCards(tournaments, user_tc)
}
async function renderWallet() {
  setActiveNav("nav-wallet")
  viewsToggle(user_wc);
  user_wc.innerHTML = "";

  const container = createElem('div', '', 'wallet-container');

  // Header
  const header = createElem('header', '', 'wallet-header');
  const title = createElem('h2', 'My Wallet');
  const depositBtn = createElem('button', 'Deposit', 'deposit-btn');
  depositBtn.onclick = () => showDepositModal(uid);
  header.append(title, depositBtn);

  // Balance card
  const balanceCard = createElem('div', '', 'balance-card');
  const balanceLabel = createElem('span', 'Available Balance', 'balance-label');
  const balanceAmount = createElem('h1', '₹0', 'wallet-balance', 'walletBalance');
  balanceCard.append(balanceLabel, balanceAmount);

  // Append all
  container.append(header, balanceCard);
  
user_wc.appendChild(container);
  renderTransactionHistory(user_wc);
  
  try {
    showSpinner("Loading wallet...");
    const res = await getUser();
    const user = await res.json();
    balanceAmount.textContent = `₹${user.wallet}`;
  } finally {
    hideSpinner();
  }
}
async function renderProfile() {
  if (!uid) {
    renderLogin();
    return;
  }
  viewsToggle(profile_c);
  profile_c.innerHTML=""
  

  try {
    showSpinner("Loading user details...")
    const res = await getUser();
    if (!res.ok) showAlert("Error fetching user data!", "error")
    const user = await res.json();

    const container = createElem('div', '', 'profile-container');
    container.appendChild(createElem('h2', 'User Profile', 'profile-title'));

    const infoSection = createElem('div', '', 'profile-info');

    Object.entries(user).forEach(([key, value]) => {
      const p = document.createElement('p');
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      p.innerHTML = `<strong>${label}:</strong> ${value ?? 'N/A'}`;
      infoSection.appendChild(p);
    });

    const logoutBtn = createElem('button', 'Logout', 'logout-btn');
    logoutBtn.onclick = () => {
      localStorage.removeItem('user');
      showAlert("Logging out successful!", "success")
      renderLogin();
    };

    container.append(infoSection, logoutBtn);
    profile_c.appendChild(container);

  } catch (err) {
    showAlert("Something went wrong! \n"+err, "error")
  } finally {
    hideSpinner()
  }
}
async function renderJoined(){
  user_jc.innerHTML=""
  viewsToggle(user_jc)
  let res = await fetchProtected("tournament/joined/"+uid)
  let json = await res.json();
  let tournaments = []
  json.registrations.forEach(async reg=>{
    tournaments.push(reg.tournament)
  })
  renderJoinedTCards(tournaments, user_jc)
  showAlert(JSON.stringify(json), "success")
}
function renderUserNav(){
  
  if(!admin_nav.classList.contains("hidden")){
    admin_nav.classList.add("hidden")
  }
  if(user_nav.classList.contains("hidden")){
    user_nav.classList.remove("hidden")
  }
  navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    setActiveNav(item, false)
  });
});
  
}
function renderLogin() {
  viewsToggle(login_c)
  renderUserNav()
  setActiveNav("nav_home")
  login_c.innerHTML = "";
  
  const container = document.createElement("div");
  container.className = "form-container";
  
  const title = document.createElement("h2");
  title.className = "form-title";
  title.textContent = "Login";
  
  const form = document.createElement("form");
  form.id = "loginForm";
  
  // UID input field
  const uidLabel = document.createElement("label");
  uidLabel.className = "form-field";
  
  const uidIcon = document.createElement("span");
  uidIcon.className = "material-symbols-outlined form-icon";
  uidIcon.textContent = "badge";
  
  const uidInput = document.createElement("input");
  uidInput.type = "text";
  uidInput.id = "uid";
  uidInput.placeholder = "Enter UID";
  uidInput.className = "form-input";
  uidInput.required = true;
  
  uidLabel.appendChild(uidIcon);
  uidLabel.appendChild(uidInput);
  
  // Password input field with toggle
  const passLabel = document.createElement("label");
  passLabel.className = "form-field";
  
  const passIcon = document.createElement("span");
  passIcon.className = "material-symbols-outlined form-icon";
  passIcon.textContent = "lock";
  
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.id = "password";
  passInput.placeholder = "Enter Password";
  passInput.className = "form-input";
  passInput.required = true;
  
  const toggleIcon = document.createElement("span");
  toggleIcon.className = "material-symbols-outlined password-toggle";
  toggleIcon.textContent = "visibility";
  
  toggleIcon.onclick = () => {
    const isHidden = passInput.type === "password";
    passInput.type = isHidden ? "text" : "password";
    toggleIcon.textContent = isHidden ? "visibility_off" : "visibility";
  };
  
  passLabel.appendChild(passIcon);
  passLabel.appendChild(passInput);
  passLabel.appendChild(toggleIcon);
  
  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "form-btn";
  submitBtn.textContent = "Login";
  
  // Switch to signup
  const switchBtn = document.createElement("button");
  switchBtn.type = "button";
  switchBtn.className = "form-toggle-btn";
  switchBtn.textContent = "Don't have an account? Sign Up";
  switchBtn.onclick = () => renderSignup();
  
  // Append everything
  form.appendChild(uidLabel);
  form.appendChild(passLabel);
  form.appendChild(submitBtn);
  
  container.appendChild(title);
  container.appendChild(form);
  container.appendChild(switchBtn);
  login_c.appendChild(container);
  
  // Submit handler
  form.onsubmit = async (e) => {
    e.preventDefault();
    const uidf = uidInput.value;
    const passwordf = passInput.value;
    
    const res = await fetch(backend_root+"auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ uid: uidf, password: passwordf }),
    });
    
    const data = await res.json();
    if(!data.success){
      showAlert("Error while logging in!", "error")
      renderLogin()
      renderUserNav()
    }else {
     localStorage.setItem("user", JSON.stringify(data.user))
     user = JSON.parse(localStorage.getItem("user"))
     uid = user?.uid;
     role = user?.role || "user";
     token = user?.access_token;
     showAlert("Login Successful!", "success")
     if (uid) {
       if (role=="admin") {
         renderAdminNav()
         renderAdminT()
       } else {
         navigateTo("/index.html")
       } 
    }else {
      renderLogin()
      setActiveNav("nav_home");
    }
      
    }
  };
}
function renderSignup() {
  viewsToggle(signup_c)
  signup_c.innerHTML=""
  
  const container = document.createElement("div");
  container.className = "form-container";
  
  const title = document.createElement("h2");
  title.className = "form-title";
  title.textContent = "Sign Up";
  
  const form = document.createElement("form");
  form.id = "signupForm";
  
  const fields = [
    { id: "name", icon: "person", placeholder: "Enter Full Name", type: "text" },
    { id: "uid", icon: "badge", placeholder: "Enter UID", type: "text" },
    { id: "email", icon: "mail", placeholder: "Enter Email", type: "email" },
    { id: "phone", icon: "call", placeholder: "Enter Phone Number", type: "phone" },
    { id: "upi_id", icon: "upi_pay", placeholder: "Enter UPI id", type: "text" },
    { id: "gender", icon: "person", placeholder: "Type your gender", type: "text" },
    { id: "dob", icon: "calendar_month6", placeholder: "Enter date", type: "date" }
  ];
  
  fields.forEach(({ id, icon, placeholder, type }) => {
    const label = document.createElement("label");
    label.className = "form-field";
    
    const span = document.createElement("span");
    span.className = "material-symbols-outlined form-icon";
    span.textContent = icon;
    
    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.placeholder = placeholder;
    input.required = true;
    input.className = "form-input";
    
    label.appendChild(span);
    label.appendChild(input);
    form.appendChild(label);
  });
  
  // Password field with toggle
  const passLabel = document.createElement("label");
  passLabel.className = "form-field";
  
  const passIcon = document.createElement("span");
  passIcon.className = "material-symbols-outlined form-icon";
  passIcon.textContent = "lock";
  
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.id = "password";
  passInput.placeholder = "Enter Password";
  passInput.required = true;
  passInput.className = "form-input";
  
  const toggleIcon = document.createElement("span");
  toggleIcon.className = "material-symbols-outlined password-toggle";
  toggleIcon.textContent = "visibility";
  toggleIcon.onclick = () => {
    const isHidden = passInput.type === "password";
    passInput.type = isHidden ? "text" : "password";
    toggleIcon.textContent = isHidden ? "visibility_off" : "visibility";
  };
  
  passLabel.appendChild(passIcon);
  passLabel.appendChild(passInput);
  passLabel.appendChild(toggleIcon);
  form.appendChild(passLabel);
  
  // Submit and switch
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "form-btn";
  submitBtn.textContent = "Sign Up";
  
  const switchBtn = document.createElement("button");
  switchBtn.type = "button";
  switchBtn.className = "form-toggle-btn";
  switchBtn.textContent = "Already have an account? Login";
  switchBtn.onclick = () => renderLogin();
  
  form.appendChild(submitBtn);
  container.appendChild(title);
  container.appendChild(form);
  container.appendChild(switchBtn);
  signup_c.appendChild(container);
  
  // Submit logic
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const uid = document.getElementById("uid").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const upi_id = document.getElementById("upi_id").value;
    const gender = document.getElementById("gender").value;
    const dob = document.getElementById("dob").value;
    
    const res = await fetch(backend_root+"auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, uid, email, phone, password, upi_id, gender, dob }),
    });
    
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      err("renderSignup()",data.error, true);
    }
  };
}

async function renderMail() {
  setActiveNav("nav-mail")
  viewsToggle(user_mc);
  user_mc.innerHTML = "";
  let mails;

  try {
    const res = await fetchProtected('/api/mails');
    mails = res.ok ? await res.json() : [
      {
        id: "1",
        from: "support@example.com",
        subject: "Your Account Verification",
        snippet: "Click the button below to verify your account.",
        date: "2025-05-16T09:24:00Z"
      },
      {
        id: "2",
        from: "newsletter@openai.com",
        subject: "May AI Research Digest",
        snippet: "Explore the latest breakthroughs in GPT.",
        date: "2025-05-15T17:30:00Z"
      }
    ];
  } catch (err) {
    showAlert(`Error loading mails: ${err.message}`, "error");
    return;
  }

  mails.forEach(mail => {
    const mailDiv = document.createElement('div');
    mailDiv.className = 'mail-item';

    const avatar = document.createElement('div');
    avatar.className = 'mail-avatar';
    avatar.textContent = mail.from.charAt(0).toUpperCase();

    const content = document.createElement('div');
    content.className = 'mail-content';
    content.innerHTML = `
      <div class="mail-from">${mail.from}</div>
      <div class="mail-subject">${mail.subject}</div>
      <div class="mail-snippet">${mail.snippet}</div>
    `;

    const date = document.createElement('div');
    date.className = 'mail-date';
    date.textContent = new Date(mail.date).toLocaleDateString();

    mailDiv.appendChild(avatar);
    mailDiv.appendChild(content);
    mailDiv.appendChild(date);

    mailDiv.onclick = () => renderMailDetail(mail.id);
    user_mc.appendChild(mailDiv);
  });
}
async function renderMailDetail(mailId) {
  setActiveNav("nav-mail");
  viewsToggle(user_mc);
  history.pushState({}, "", `/mail/${mailId}`);
  
  const dummyMails = {
    "1": {
      id: "1",
      from: "support@example.com",
      subject: "Your Account Verification",
      snippet: "Click the button below to verify your account.",
      body: "Please verify your account by clicking the link below. This helps keep your account secure.",
      date: "2025-05-16T09:24:00Z"
    },
    "2": {
      id: "2",
      from: "newsletter@openai.com",
      subject: "May AI Research Digest",
      snippet: "Explore the latest breakthroughs in GPT.",
      body: "Here are the top AI research updates from May 2025...",
      date: "2025-05-15T17:30:00Z"
    }
  };
  
  const mail = dummyMails[mailId];
  
  if (!mail) {
    showAlert("Mail not found!", "error");
    return;
  }
  
  user_mc.innerHTML = `
    <div class="mail-view">
      <div class="mail-header">
        <button id="back-to-inbox" class="mail-back">← Back</button>
        <h2 class="mail-subject">${mail.subject}</h2>
        <div class="mail-meta">
          <span class="mail-from">${mail.from}</span>
          <span class="mail-date">${new Date(mail.date).toLocaleString()}</span>
        </div>
      </div>
      <div class="mail-body">${mail.body}</div>
    </div>
  `;
  
  document.getElementById("back-to-inbox").onclick = () => navigateTo("/mail");
}



//admin render functions
function openTournamentModal() {
  modal.innerHTML=''
  modal.classList.remove('hidden')
  const overlay = modal;
  overlay.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const closeBtn = document.createElement("span");
  closeBtn.className = "close";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => overlay.classList.add("hidden");

  const title = document.createElement("h2");
  title.textContent = "Add Tournament";

  const form = document.createElement("form");
  form.id = "tournamentForm";

  const fields = [
  { label: "Title", name: "title", type: "text" ,placeholder: "Free Fire Max Tournament"},
  { label: "Entry Fee", name: "entry_fee", type: "number", step: "0.01" , placeholder: 10},
  { label: "Max Teams", name: "max_teams", type: "number" , placeholder: 48},
  { label: "Prize Pool (JSON)", name: "prize_pool", type: "text", placeholder: '{"per_kill_reward": 7, "rank_reward": [10]}' },
  { label: "Tags (comma-separated)", name: "tags", type: "text" , placeholder: "BR,Solo"},
  { label: "Tournament Start Time", name: "start_time", type: "datetime-local" }
];
  fields.forEach(({ label, name, type, step, placeholder }) => {
    const lbl = document.createElement("label");
    lbl.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.required = true;
    input.value = placeholder;
    form.appendChild(lbl);
    form.appendChild(input);
  });

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Create";
  form.appendChild(submitBtn);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
      const all = {
  title: formData.get("title").trim(),
  entry_fee: parseFloat(formData.get("entry_fee")),
  max_teams: parseInt(formData.get("max_teams")),
  prize_pool: JSON.parse(formData.get("prize_pool")),
  tags: formData.get("tags").split(",").map(tag => tag.trim()).filter(Boolean),
  start_time: formData.get("start_time") + ":00"
};

      const res = await fetchProtected("tournament", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(all)
      });

      const data = await res.json();
      if (!res.ok) showAlert(data.message || "Error creating tournament", "error");
      
      renderAdminT()
    } catch (err) {

    }
    overlay.remove()
  };

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(form);
  overlay.appendChild(modalContent);
  document.body.appendChild(overlay);
}
async function depositMoney(amount, upi_id, token = token) {
  const res = await fetchProtected("http://localhost:4000/api/wallet/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amount, upi_id })
  });

  const data = await res.json();
  showAlert("Deposit Response:\n"+data, "success");
  return data;
}


//initial setup
setupPullToRefresh(() => refresh());
window.addEventListener('popstate', async () => {
  refresh()
});
document.addEventListener('DOMContentLoaded', () => {
  showSpinner("Loading...")
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
});
window.onload = async () => {
  //testBackendConnection();
  hideSpinner()
  renderUserNav()
  if (uid) {
    if (role=="admin") {
      renderAdminNav()
      renderAdminT()
    } else {
    navigateTo("/index.html")
  } 
  }else {
    renderLogin()
    setActiveNav("nav_home");
  }
};