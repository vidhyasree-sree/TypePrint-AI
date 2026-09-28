/* =========================================================
   TYPEPRINT
   AI PROXY ATTENDANCE DETECTOR
   STEP 3 - COMPLETE JAVASCRIPT
========================================================= */


/* =========================================================
   1. GLOBAL SETTINGS
========================================================= */

const PHRASE =
    "TypePrint verifies my identity through my typing rhythm.";

const TOTAL_SAMPLES = 10;

const MATCH_THRESHOLD = 70;


/* =========================================================
   2. APPLICATION STATE
========================================================= */

let enrolledUsers = [];

let currentUser = null;

let enrollmentSamples = [];

let enrollmentKeystrokes = [];

let verificationKeystrokes = [];

let enrollmentStartTime = null;

let verificationStartTime = null;

let lastKeyDownTime = null;

let lastKeyUpTime = null;

let currentDwellTimes = [];

let currentFlightTimes = [];

let currentTypingSpeed = 0;

let verificationRunning = false;

let verifiedCount = 0;

let proxyCount = 0;

let typingChartData = [];


/* =========================================================
   3. DOM ELEMENTS
========================================================= */

const navItems =
    document.querySelectorAll(".nav-item");

const pageSections =
    document.querySelectorAll(".page-section");

const actionCards =
    document.querySelectorAll(".action-card");


/* Dashboard */

const totalUsersElement =
    document.getElementById("totalUsers");

const verifiedCountElement =
    document.getElementById("verifiedCount");

const proxyCountElement =
    document.getElementById("proxyCount");

const accuracyElement =
    document.getElementById("accuracy");

const dashboardStatus =
    document.getElementById("dashboardStatus");


/* Enrollment */

const userNameInput =
    document.getElementById("userName");

const userIdInput =
    document.getElementById("userId");

const enrollmentInput =
    document.getElementById("enrollmentInput");

const enrollmentPhrase =
    document.getElementById("enrollmentPhrase");

const sampleNumber =
    document.getElementById("sampleNumber");

const enrollSampleBtn =
    document.getElementById("enrollSampleBtn");

const enrollmentProgress =
    document.getElementById("enrollmentProgress");

const enrollmentProgressText =
    document.getElementById(
        "enrollmentProgressText"
    );

const enrollmentMessage =
    document.getElementById(
        "enrollmentMessage"
    );

const dwellDisplay =
    document.getElementById("dwellDisplay");

const flightDisplay =
    document.getElementById("flightDisplay");

const speedDisplay =
    document.getElementById("speedDisplay");


/* Verification */

const verificationInput =
    document.getElementById(
        "verificationInput"
    );

const verificationPhrase =
    document.getElementById(
        "verificationPhrase"
    );

const verificationUser =
    document.getElementById(
        "verificationUser"
    );

const verifyBtn =
    document.getElementById("verifyBtn");

const clearVerificationBtn =
    document.getElementById(
        "clearVerificationBtn"
    );

const verificationProgress =
    document.getElementById(
        "verificationProgress"
    );

const resultStatus =
    document.getElementById("resultStatus");

const matchPercentage =
    document.getElementById(
        "matchPercentage"
    );

const matchCircle =
    document.getElementById("matchCircle");

const resultTitle =
    document.getElementById("resultTitle");

const resultDescription =
    document.getElementById(
        "resultDescription"
    );

const patternResult =
    document.getElementById(
        "patternResult"
    );

const confidenceResult =
    document.getElementById(
        "confidenceResult"
    );

const decisionTime =
    document.getElementById(
        "decisionTime"
    );


/* Analytics */

const analyticsDwell =
    document.getElementById(
        "analyticsDwell"
    );

const analyticsFlight =
    document.getElementById(
        "analyticsFlight"
    );

const analyticsSpeed =
    document.getElementById(
        "analyticsSpeed"
    );

const analyticsKeys =
    document.getElementById(
        "analyticsKeys"
    );

const chartCanvas =
    document.getElementById(
        "typingChart"
    );


/* =========================================================
   4. INITIALIZATION
========================================================= */

function initializeApp() {

    enrollmentPhrase.textContent =
        PHRASE;

    verificationPhrase.textContent =
        PHRASE;

    updateDashboard();

    setupNavigation();

    setupTypingCapture();

    setupButtons();

    drawTypingChart();

    loadStoredUsers();

}


/* =========================================================
   5. NAVIGATION
========================================================= */

function setupNavigation() {

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const section =
                    item.dataset.section;

                showSection(section);

            }
        );

    });


    actionCards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const section =
                    card.dataset.section;

                showSection(section);

            }
        );

    });

}


function showSection(sectionId) {

    pageSections.forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });


    navItems.forEach(item => {

        item.classList.remove(
            "active"
        );

    });


    const targetSection =
        document.getElementById(sectionId);

    if (targetSection) {

        targetSection.classList.add(
            "active-section"
        );

    }


    navItems.forEach(item => {

        if (
            item.dataset.section ===
            sectionId
        ) {

            item.classList.add(
                "active"
            );

        }

    });

}


/* =========================================================
   6. BUTTON EVENTS
========================================================= */

function setupButtons() {

    enrollSampleBtn.addEventListener(
        "click",
        recordEnrollmentSample
    );


    verifyBtn.addEventListener(
        "click",
        verifyUser
    );


    clearVerificationBtn.addEventListener(
        "click",
        clearVerification
    );

}


/* =========================================================
   7. TYPING CAPTURE
========================================================= */

function setupTypingCapture() {

    enrollmentInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Shift" ||
                event.key === "Control" ||
                event.key === "Alt" ||
                event.key === "Meta"
            ) {
                return;
            }


            const now =
                performance.now();


            if (
                lastKeyUpTime !== null
            ) {

                const flight =
                    now - lastKeyUpTime;

                currentFlightTimes.push(
                    flight
                );

            }


            lastKeyDownTime = now;


            enrollmentKeystrokes.push({

                key: event.key,

                down: now,

                up: null

            });

        }
    );


    enrollmentInput.addEventListener(
        "keyup",
        event => {

            const now =
                performance.now();


            const last =
                enrollmentKeystrokes[
                    enrollmentKeystrokes.length - 1
                ];


            if (
                last &&
                last.up === null
            ) {

                last.up = now;


                const dwell =
                    now - last.down;

                currentDwellTimes.push(
                    dwell
                );

            }


            lastKeyUpTime = now;

            updateLiveMetrics();

        }
    );


    enrollmentInput.addEventListener(
        "input",
        updateEnrollmentButton
    );


    /* Verification capture */

    verificationInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Shift" ||
                event.key === "Control" ||
                event.key === "Alt" ||
                event.key === "Meta"
            ) {
                return;
            }


            const now =
                performance.now();


            if (
                lastKeyUpTime !== null
            ) {

                const flight =
                    now - lastKeyUpTime;

                currentFlightTimes.push(
                    flight
                );

            }


            lastKeyDownTime = now;


            verificationKeystrokes.push({

                key: event.key,

                down: now,

                up: null

            });

        }
    );


    verificationInput.addEventListener(
        "keyup",
        event => {

            const now =
                performance.now();


            const last =
                verificationKeystrokes[
                    verificationKeystrokes.length - 1
                ];


            if (
                last &&
                last.up === null
            ) {

                last.up = now;

                const dwell =
                    now - last.down;

                currentDwellTimes.push(
                    dwell
                );

            }


            lastKeyUpTime = now;

            updateVerificationButton();

            updateLiveMetrics();

        }
    );


    verificationInput.addEventListener(
        "input",
        updateVerificationButton
    );

}


/* =========================================================
   8. LIVE METRICS
========================================================= */

function updateLiveMetrics() {

    const dwell =
        average(currentDwellTimes);


    const flight =
        average(currentFlightTimes);


    let activeInput = null;


    if (
        document.activeElement ===
        enrollmentInput
    ) {

        activeInput =
            enrollmentInput;

    }


    if (
        document.activeElement ===
        verificationInput
    ) {

        activeInput =
            verificationInput;

    }


    let speed = 0;


    if (
        activeInput &&
        activeInput.value.length > 0
    ) {

        const words =
            activeInput.value
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .length;


        let startTime =
            enrollmentStartTime;


        if (
            activeInput ===
            verificationInput
        ) {

            startTime =
                verificationStartTime;

        }


        if (startTime) {

            const minutes =
                (
                    performance.now() -
                    startTime
                ) / 60000;


            if (minutes > 0) {

                speed =
                    words / minutes;

            }

        }

    }


    currentTypingSpeed = speed;


    dwellDisplay.textContent =
        formatMilliseconds(dwell);


    flightDisplay.textContent =
        formatMilliseconds(flight);


    speedDisplay.textContent =
        formatNumber(speed) +
        " WPM";


    analyticsDwell.textContent =
        formatMilliseconds(dwell);


    analyticsFlight.textContent =
        formatMilliseconds(flight);


    analyticsSpeed.textContent =
        formatNumber(speed) +
        " WPM";


    analyticsKeys.textContent =
        enrollmentKeystrokes.length +
        verificationKeystrokes.length;

}


/* =========================================================
   9. ENROLLMENT START TIME
========================================================= */

enrollmentInput.addEventListener(
    "focus",
    () => {

        if (
            enrollmentStartTime === null
        ) {

            enrollmentStartTime =
                performance.now();

        }

    }
);


verificationInput.addEventListener(
    "focus",
    () => {

        if (
            verificationStartTime === null
        ) {

            verificationStartTime =
                performance.now();

        }

    }
);


/* =========================================================
   10. ENROLLMENT BUTTON
========================================================= */

function updateEnrollmentButton() {

    const text =
        enrollmentInput.value.trim();


    const correctLength =
        text.length >=
        PHRASE.length;


    const phraseReady =
        normalizeText(text) ===
        normalizeText(PHRASE);


    enrollSampleBtn.disabled =
        !correctLength ||
        !phraseReady;

}


function updateVerificationButton() {

    const text =
        verificationInput.value.trim();


    const phraseReady =
        normalizeText(text) ===
        normalizeText(PHRASE);


    verifyBtn.disabled =
        !phraseReady ||
        enrolledUsers.length === 0;

}


/* =========================================================
   11. RECORD ENROLLMENT SAMPLE
========================================================= */

function recordEnrollmentSample() {

    const name =
        userNameInput.value.trim();

    const id =
        userIdInput.value.trim();


    if (!name || !id) {

        showEnrollmentMessage(
            "Please enter student name and student ID.",
            "error"
        );

        return;

    }


    const text =
        enrollmentInput.value.trim();


    if (
        normalizeText(text) !==
        normalizeText(PHRASE)
    ) {

        showEnrollmentMessage(
            "Please type the exact phrase.",
            "error"
        );

        return;

    }


    const features =
        extractFeatures(
            enrollmentKeystrokes,
            currentDwellTimes,
            currentFlightTimes,
            enrollmentStartTime,
            text
        );


    enrollmentSamples.push(features);


    const sampleCount =
        enrollmentSamples.length;


    sampleNumber.textContent =
        sampleCount;


    const percentage =
        (
            sampleCount /
            TOTAL_SAMPLES
        ) * 100;


    enrollmentProgress.style.width =
        percentage + "%";


    enrollmentProgressText.textContent =
        Math.round(percentage) + "%";


    showEnrollmentMessage(
        "Sample " +
        sampleCount +
        " recorded successfully.",
        "success"
    );


    resetCurrentCapture();


    if (
        sampleCount >=
        TOTAL_SAMPLES
    ) {

        finishEnrollment();

    }

}


/* =========================================================
   12. FINISH ENROLLMENT
========================================================= */

function finishEnrollment() {

    const name =
        userNameInput.value.trim();

    const id =
        userIdInput.value.trim();


    const profile =
        createUserProfile(
            name,
            id,
            enrollmentSamples
        );


    enrolledUsers.push(profile);

    currentUser = profile;


    saveUsers();


    totalUsersElement.textContent =
        enrolledUsers.length;


    verificationUser.textContent =
        profile.name;


    showEnrollmentMessage(
        "Enrollment completed! " +
        profile.name +
        " now has a typing biometric profile.",
        "success"
    );


    enrollSampleBtn.disabled =
        true;


    enrollmentInput.disabled =
        true;


    updateDashboard();


    setTimeout(() => {

        showSection(
            "verification"
        );

    }, 900);

}


/* =========================================================
   13. CREATE USER PROFILE
========================================================= */

function createUserProfile(
    name,
    id,
    samples
) {

    const averageDwell =
        average(
            samples.map(
                sample =>
                    sample.avgDwell
            )
        );


    const averageFlight =
        average(
            samples.map(
                sample =>
                    sample.avgFlight
            )
        );


    const averageSpeed =
        average(
            samples.map(
                sample =>
                    sample.typingSpeed
            )
        );


    const dwellVariation =
        standardDeviation(
            samples.map(
                sample =>
                    sample.avgDwell
            )
        );


    const flightVariation =
        standardDeviation(
            samples.map(
                sample =>
                    sample.avgFlight
            )
        );


    return {

        name: name,

        id: id,

        createdAt:
            new Date().toISOString(),

        profile: {

            avgDwell:
                averageDwell,

            avgFlight:
                averageFlight,

            typingSpeed:
                averageSpeed,

            dwellVariation:
                dwellVariation,

            flightVariation:
                flightVariation

        },

        samples: samples

    };

}


/* =========================================================
   14. EXTRACT FEATURES
========================================================= */

function extractFeatures(
    keystrokes,
    dwellTimes,
    flightTimes,
    startTime,
    text
) {

    const avgDwell =
        average(dwellTimes);


    const avgFlight =
        average(flightTimes);


    const words =
        text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;


    let typingSpeed = 0;


    if (startTime) {

        const minutes =
            (
                performance.now() -
                startTime
            ) / 60000;


        if (minutes > 0) {

            typingSpeed =
                words / minutes;

        }

    }


    return {

        avgDwell:
            avgDwell,

        avgFlight:
            avgFlight,

        typingSpeed:
            typingSpeed,

        keyCount:
            keystrokes.length,

        dwellTimes:
            [...dwellTimes],

        flightTimes:
            [...flightTimes]

    };

}


/* =========================================================
   15. VERIFY USER
========================================================= */

async function verifyUser() {

    if (
        enrolledUsers.length === 0
    ) {

        showVerificationResult(
            0,
            false,
            "No enrolled user found.",
            "Please complete enrollment first."
        );

        return;

    }


    if (
        verificationRunning
    ) {
        return;
    }


    verificationRunning =
        true;


    verifyBtn.disabled =
        true;


    verificationProgress.classList.remove(
        "hidden"
    );


    const startDecision =
        performance.now();


    /*
       Small delay for realistic
       AI-analysis demonstration.
    */

    await wait(650);


    const text =
        verificationInput.value.trim();


    const features =
        extractFeatures(
            verificationKeystrokes,
            currentDwellTimes,
            currentFlightTimes,
            verificationStartTime,
            text
        );


    const result =
        findBestMatchingUser(
            features
        );


    const elapsed =
        performance.now() -
        startDecision;


    decisionTime.textContent =
        Math.round(elapsed) +
        " ms";


    showVerificationResult(
        result.score,
        result.isMatch,
        result.isMatch
            ? "Real User Detected"
            : "Proxy Detected",
        result.isMatch
            ? "The typing rhythm is consistent with the enrolled profile."
            : "The current typing rhythm does not sufficiently match the enrolled profile."
    );


    verificationProgress.classList.add(
        "hidden"
    );


    if (result.isMatch) {

        verifiedCount++;

    } else {

        proxyCount++;

    }


    updateDashboard();


    typingChartData =
        features.dwellTimes.slice(
            0,
            30
        );


    drawTypingChart();


    verificationRunning =
        false;

}


/* =========================================================
   16. FIND BEST MATCH
========================================================= */

function findBestMatchingUser(
    currentFeatures
) {

    let bestUser = null;

    let bestScore = 0;


    enrolledUsers.forEach(user => {

        const score =
            calculateMatchScore(
                currentFeatures,
                user.profile
            );


        if (
            score >
            bestScore
        ) {

            bestScore =
                score;

            bestUser =
                user;

        }

    });


    const isMatch =
        bestScore >=
        MATCH_THRESHOLD;


    if (bestUser) {

        currentUser =
            bestUser;

        verificationUser.textContent =
            bestUser.name;

    }


    return {

        user:
            bestUser,

        score:
            Math.round(bestScore),

        isMatch:
            isMatch

    };

}


/* =========================================================
   17. MATCH SCORE
========================================================= */

function calculateMatchScore(
    current,
    enrolled
) {

    /*
       This is the browser demo scoring layer.

       Step 4 will replace this section with
       the Python Flask + Scikit-learn model.
    */


    const dwellDifference =
        normalizedDifference(
            current.avgDwell,
            enrolled.avgDwell
        );


    const flightDifference =
        normalizedDifference(
            current.avgFlight,
            enrolled.avgFlight
        );


    const speedDifference =
        normalizedDifference(
            current.typingSpeed,
            enrolled.typingSpeed
        );


    const dwellScore =
        100 -
        clamp(
            dwellDifference *
            100,
            0,
            100
        );


    const flightScore =
        100 -
        clamp(
            flightDifference *
            100,
            0,
            100
        );


    const speedScore =
        100 -
        clamp(
            speedDifference *
            100,
            0,
            100
        );


    /*
       Weighted biometric score
    */

    const finalScore =
        (
            dwellScore * 0.40
        ) +
        (
            flightScore * 0.40
        ) +
        (
            speedScore * 0.20
        );


    /*
       Add small sample consistency
       factor based on key count.
    */

    const keyFactor =
        current.keyCount > 10
            ? 1
            : 0.85;


    return clamp(
        finalScore *
        keyFactor,
        0,
        100
    );

}


/* =========================================================
   18. VERIFICATION RESULT UI
========================================================= */

function showVerificationResult(
    score,
    isMatch,
    title,
    description
) {

    matchPercentage.textContent =
        Math.round(score) +
        "%";


    resultTitle.textContent =
        title;


    resultDescription.textContent =
        description;


    if (isMatch) {

        resultStatus.textContent =
            "REAL USER";

        resultStatus.className =
            "status-badge success";


        matchCircle.className =
            "match-circle success";


        patternResult.textContent =
            "MATCH";


        confidenceResult.textContent =
            Math.round(score) +
            "%";


        dashboardStatus.textContent =
            "VERIFIED";


        dashboardStatus.className =
            "status-badge success";

    } else {

        resultStatus.textContent =
            "PROXY DETECTED";

        resultStatus.className =
            "status-badge danger";


        matchCircle.className =
            "match-circle danger";


        patternResult.textContent =
            "MISMATCH";


        confidenceResult.textContent =
            Math.round(
                100 - score
            ) +
            "% Suspicion";


        dashboardStatus.textContent =
            "PROXY DETECTED";


        dashboardStatus.className =
            "status-badge danger";

    }

}


/* =========================================================
   19. CLEAR VERIFICATION
========================================================= */

function clearVerification() {

    verificationInput.value =
        "";


    verificationKeystrokes =
        [];


    currentDwellTimes =
        [];


    currentFlightTimes =
        [];


    verificationStartTime =
        null;


    lastKeyDownTime =
        null;


    lastKeyUpTime =
        null;


    matchPercentage.textContent =
        "--%";


    resultTitle.textContent =
        "Waiting for verification";


    resultDescription.textContent =
        "Type the phrase and start verification to receive an AI-based result.";


    resultStatus.textContent =
        "WAITING";


    resultStatus.className =
        "status-badge waiting";


    matchCircle.className =
        "match-circle";


    patternResult.textContent =
        "--";


    confidenceResult.textContent =
        "--";


    decisionTime.textContent =
        "--";


    dashboardStatus.textContent =
        "WAITING";


    dashboardStatus.className =
        "status-badge waiting";


    verifyBtn.disabled =
        true;


    verificationProgress.classList.add(
        "hidden"
    );

}


/* =========================================================
   20. RESET ENROLLMENT CAPTURE
========================================================= */

function resetCurrentCapture() {

    enrollmentInput.value =
        "";


    enrollmentKeystrokes =
        [];


    currentDwellTimes =
        [];


    currentFlightTimes =
        [];


    enrollmentStartTime =
        null;


    lastKeyDownTime =
        null;


    lastKeyUpTime =
        null;


    updateLiveMetrics();


    enrollSampleBtn.disabled =
        true;

}


/* =========================================================
   21. ENROLLMENT MESSAGE
========================================================= */

function showEnrollmentMessage(
    message,
    type
) {

    enrollmentMessage.textContent =
        message;


    enrollmentMessage.className =
        "message-box " +
        type;

}


/* =========================================================
   22. DASHBOARD
========================================================= */

function updateDashboard() {

    totalUsersElement.textContent =
        enrolledUsers.length;


    verifiedCountElement.textContent =
        verifiedCount;


    proxyCountElement.textContent =
        proxyCount;


    const totalTests =
        verifiedCount +
        proxyCount;


    if (
        totalTests > 0
    ) {

        const accuracy =
            (
                verifiedCount /
                totalTests
            ) * 100;


        accuracyElement.textContent =
            Math.round(accuracy) +
            "%";

    } else {

        accuracyElement.textContent =
            "--%";

    }

}


/* =========================================================
   23. LOCAL STORAGE
========================================================= */

function saveUsers() {

    localStorage.setItem(
        "typeprint_users",
        JSON.stringify(
            enrolledUsers
        )
    );

}


function loadStoredUsers() {

    const saved =
        localStorage.getItem(
            "typeprint_users"
        );


    if (!saved) {
        return;
    }


    try {

        enrolledUsers =
            JSON.parse(saved);


        totalUsersElement.textContent =
            enrolledUsers.length;


        if (
            enrolledUsers.length > 0
        ) {

            currentUser =
                enrolledUsers[
                    enrolledUsers.length - 1
                ];


            verificationUser.textContent =
                currentUser.name;

        }

    } catch (error) {

        console.log(
            "Stored data could not be loaded."
        );

    }

}


/* =========================================================
   24. TYPING CHART
========================================================= */

function drawTypingChart() {

    if (!chartCanvas) {
        return;
    }


    const ctx =
        chartCanvas.getContext("2d");


    const width =
        chartCanvas.width =
        chartCanvas.clientWidth *
        window.devicePixelRatio;


    const height =
        chartCanvas.height =
        chartCanvas.clientHeight *
        window.devicePixelRatio;


    ctx.scale(
        window.devicePixelRatio,
        window.devicePixelRatio
    );


    const displayWidth =
        chartCanvas.clientWidth;


    const displayHeight =
        chartCanvas.clientHeight;


    ctx.clearRect(
        0,
        0,
        displayWidth,
        displayHeight
    );


    /* Background */

    ctx.fillStyle =
        "#0b0f19";

    ctx.fillRect(
        0,
        0,
        displayWidth,
        displayHeight
    );


    /* Grid */

    ctx.strokeStyle =
        "rgba(255,255,255,0.06)";

    ctx.lineWidth = 1;


    for (
        let y = 30;
        y < displayHeight;
        y += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            displayWidth,
            y
        );

        ctx.stroke();

    }


    for (
        let x = 30;
        x < displayWidth;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            displayHeight
        );

        ctx.stroke();

    }


    if (
        typingChartData.length === 0
    ) {

        ctx.fillStyle =
            "#8f98ad";

        ctx.font =
            "12px Segoe UI";


        ctx.textAlign =
            "center";


        ctx.fillText(
            "Typing data will appear here after a test",
            displayWidth / 2,
            displayHeight / 2
        );


        return;

    }


    const max =
        Math.max(
            ...typingChartData,
            1
        );


    const min =
        Math.min(
            ...typingChartData
        );


    const range =
        Math.max(
            max - min,
            1
        );


    ctx.beginPath();


    typingChartData.forEach(
        (value, index) => {

            const x =
                (
                    index /
                    Math.max(
                        typingChartData.length - 1,
                        1
                    )
                ) *
                (
                    displayWidth - 40
                ) +
                20;


            const y =
                displayHeight -
                (
                    (
                        value - min
                    ) /
                    range
                ) *
                (
                    displayHeight - 60
                ) -
                30;


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.strokeStyle =
        "#7c5cff";

    ctx.lineWidth = 2.5;

    ctx.stroke();


    /* Points */

    typingChartData.forEach(
        (value, index) => {

            const x =
                (
                    index /
                    Math.max(
                        typingChartData.length - 1,
                        1
                    )
                ) *
                (
                    displayWidth - 40
                ) +
                20;


            const y =
                displayHeight -
                (
                    (
                        value - min
                    ) /
                    range
                ) *
                (
                    displayHeight - 60
                ) -
                30;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                3,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#21d4fd";

            ctx.fill();

        }
    );


    ctx.fillStyle =
        "#8f98ad";

    ctx.font =
        "10px Segoe UI";


    ctx.textAlign =
        "left";


    ctx.fillText(
        "Dwell Time Pattern",
        15,
        18
    );

}


/* =========================================================
   25. WINDOW RESIZE
========================================================= */

window.addEventListener(
    "resize",
    drawTypingChart
);


/* =========================================================
   26. HELPER FUNCTIONS
========================================================= */

function average(values) {

    if (
        !values ||
        values.length === 0
    ) {

        return 0;

    }


    return (
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        values.length
    );

}


function standardDeviation(
    values
) {

    if (
        !values ||
        values.length === 0
    ) {

        return 0;

    }


    const avg =
        average(values);


    const variance =
        average(
            values.map(
                value =>
                    Math.pow(
                        value - avg,
                        2
                    )
            )
        );


    return Math.sqrt(
        variance
    );

}


function normalizedDifference(
    a,
    b
) {

    if (
        a === 0 &&
        b === 0
    ) {

        return 0;

    }


    const denominator =
        Math.max(
            Math.abs(b),
            1
        );


    return Math.abs(
        a - b
    ) / denominator;

}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(
            value,
            min
        ),
        max
    );

}


function normalizeText(
    text
) {

    return text
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toLowerCase();

}


function formatMilliseconds(
    value
) {

    if (
        !value ||
        !isFinite(value)
    ) {

        return "-- ms";

    }


    return (
        Math.round(value) +
        " ms"
    );

}


function formatNumber(
    value
) {

    if (
        !isFinite(value)
    ) {

        return "0";

    }


    return Math.round(
        value
    );

}


function wait(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   27. START APPLICATION
========================================================= */

initializeApp();