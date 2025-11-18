// DOM refs
const conditionSelect = document.getElementById("condition");
const startBtn = document.getElementById("startBtn");
const survey = document.getElementById("survey");
const finishBtn = document.getElementById("finishBtn");
const exportBox = document.getElementById("export");

const leftAds = document.getElementById("left-ads");
const rightAds = document.getElementById("right-ads");
const popupAd = document.getElementById("popup-ad");
const closePopup = document.getElementById("closePopup");

const distractionInput = document.getElementById("distraction");
const articleList = document.querySelectorAll(".article");

// status bar
const statusCondition = document.getElementById("status-condition");
const statusTimer = document.getElementById("status-timer");
const statusClicks = document.getElementById("status-clicks");
const statusAdClicks = document.getElementById("status-adclicks");

// start screen
const startScreen = document.getElementById("start-screen");
const beginExperimentBtn = document.getElementById("beginExperiment");
const experimentControls = document.getElementById("experiment-controls");

let timerInterval = null;
let popupAlreadyShown = false;

let experimentData = {
  participantId: "P-" + Math.floor(Math.random() * 100000),
  condition: "medium",
  startTime: null,
  endTime: null,
  taskTimeMs: null,
  correctClicked: false,
  totalClicks: 0,
  wrongClicks: 0,
  adClicks: 0,
  popupShown: false,
  selfReportedDistraction: null,
  distractionScore: null
};

// create ad element
function createAd(text = "Ad: Super deal!") {
  const ad = document.createElement("div");
  ad.className = "ad-box";
  ad.textContent = text;
  ad.addEventListener("click", () => {
    experimentData.adClicks += 1;
    experimentData.totalClicks += 1;
    updateStatusBar();
  });
  return ad;
}

// apply condition
function applyCondition(cond) {
  experimentData.condition = cond;
  statusCondition.textContent = "Condition: " + cond;

  // reset ad areas
  leftAds.style.display = "none";
  rightAds.style.display = "none";
  leftAds.innerHTML = "";
  rightAds.innerHTML = "";

  // reset popup
  popupAd.classList.add("hidden");
  popupAlreadyShown = false;
  experimentData.popupShown = false;

  if (cond === "none") return;

  if (cond === "medium") {
    leftAds.style.display = "flex";
    rightAds.style.display = "flex";
    leftAds.appendChild(createAd("Ad: New Laptop Sale"));
    rightAds.appendChild(createAd("Ad: Learn JS in 30 days"));
  }

  if (cond === "heavy") {
    leftAds.style.display = "flex";
    rightAds.style.display = "flex";
    for (let i = 0; i < 3; i++) {
      leftAds.appendChild(createAd("Sponsored " + (i + 1)));
      rightAds.appendChild(createAd("🔥 Flash Deal " + (i + 1)));
    }
    // show popup once
    setTimeout(() => {
      if (!popupAlreadyShown) {
        popupAd.classList.remove("hidden");
        popupAlreadyShown = true;
        experimentData.popupShown = true;
      }
    }, 2000);
  }
}

// update status bar UI
function updateStatusBar() {
  statusClicks.textContent = "Clicks: " + experimentData.totalClicks;
  statusAdClicks.textContent = "Ad Clicks: " + experimentData.adClicks;
}

// start timer visual
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!experimentData.startTime) return;
    const now = performance.now();
    const elapsed = (now - experimentData.startTime) / 1000;
    statusTimer.textContent = "Time: " + elapsed.toFixed(2) + "s";
  }, 100);
}

// stop timer visual
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// when user acknowledges instructions
beginExperimentBtn.addEventListener("click", () => {
  startScreen.classList.remove("visible");
  experimentControls.classList.remove("disabled");
});

conditionSelect.addEventListener("change", (e) => {
  applyCondition(e.target.value);
});

// start task
startBtn.addEventListener("click", () => {
  experimentData.startTime = performance.now();
  experimentData.endTime = null;
  experimentData.taskTimeMs = null;
  experimentData.correctClicked = false;
  experimentData.totalClicks = 0;
  experimentData.wrongClicks = 0;
  experimentData.adClicks = 0;
  survey.classList.add("hidden");
  exportBox.classList.add("hidden");
  updateStatusBar();
  startTimer();
});

// article clicks
articleList.forEach((item) => {
  item.addEventListener("click", () => {
    // count every click on list
    experimentData.totalClicks += 1;
    updateStatusBar();

    if (!experimentData.startTime) return;

    const isCorrect = item.dataset.correct === "true";
    if (isCorrect) {
      experimentData.correctClicked = true;
      experimentData.endTime = performance.now();
      experimentData.taskTimeMs = Math.round(
        experimentData.endTime - experimentData.startTime
      );
      stopTimer();
      statusTimer.textContent =
        "Time: " + (experimentData.taskTimeMs / 1000).toFixed(2) + "s";
      survey.classList.remove("hidden");
    } else {
      experimentData.wrongClicks += 1;
    }
  });
});

// popup close
closePopup.addEventListener("click", () => {
  popupAd.classList.add("hidden");
});

// finish survey
finishBtn.addEventListener("click", () => {
  const selfD = parseInt(distractionInput.value, 10) || 1;
  experimentData.selfReportedDistraction = selfD;
  const timeSeconds = (experimentData.taskTimeMs || 0) / 1000;

  // distraction score
  const score =
    (experimentData.wrongClicks * 2 +
      experimentData.adClicks * 3 +
      timeSeconds * 0.5) *
    (1 + selfD / 7);

  experimentData.distractionScore = Number(score.toFixed(2));

  const csv =
    "participantId,condition,taskTimeMs,wrongClicks,adClicks,totalClicks,selfReportedDistraction,distractionScore\n" +
    `${experimentData.participantId},${experimentData.condition},${experimentData.taskTimeMs},${experimentData.wrongClicks},${experimentData.adClicks},${experimentData.totalClicks},${experimentData.selfReportedDistraction},${experimentData.distractionScore}`;

  exportBox.value = csv;
  exportBox.classList.remove("hidden");
  alert("Data recorded. Copy the CSV below.");
});

// init
applyCondition(conditionSelect.value);
updateStatusBar();
statusTimer.textContent = "Time: 0.00s";
