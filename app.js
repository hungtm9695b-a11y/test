//------------------------------------------------------
// CHUYỂN BƯỚC
//------------------------------------------------------
function goToStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById("step" + i).classList.add("hidden");
    document.getElementById("stepLabel" + i).classList.remove("active");
  }
  document.getElementById("step" + step).classList.remove("hidden");
  document.getElementById("stepLabel" + step).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

//------------------------------------------------------
// TÁCH HUYẾT ÁP
//------------------------------------------------------
function parseBloodPressure(text) {
  if (!text) return { sbp: NaN, dbp: NaN };
  const cleaned = text.replace(/\s+/g, "");
  const parts = cleaned.split("/");
  if (parts.length === 2) {
    return { sbp: parseInt(parts[0]), dbp: parseInt(parts[1]) };
  }
  return { sbp: parseInt(cleaned), dbp: NaN };
}

//------------------------------------------------------
// HEAR SCORE (tham khảo)
//------------------------------------------------------
function calculateHEAR() {
  let H = 0, E = 0, A = 0, R = 0;

  const symptoms = document.querySelectorAll(".symptom:checked").length;
  if (symptoms <= 2) H = 0;
  else if (symptoms <= 4) H = 1;
  else H = 2;

  const ischemia = document.getElementById("ecgIschemia").value === "1";
  const other = document.getElementById("ecgOtherAbnormal").value === "1";
  if (!ischemia && !other) E = 0;
  else if (other && !ischemia) E = 1;
  else if (ischemia) E = 2;

  const age = parseInt(document.getElementById("patientAge").value);
  if (age < 45) A = 0;
  else if (age < 65) A = 1;
  else A = 2;

  const riskCount = document.querySelectorAll(".risk:checked").length;
  if (riskCount === 0) R = 0;
  else if (riskCount <= 2) R = 1;
  else R = 2;

  return { H, E, A, R, total: H + E + A + R };
}

//------------------------------------------------------
// PREVIEW ECG + GỌI AI DEMO
//------------------------------------------------------
const ecgFileInput = document.getElementById("ecgFile");
const ecgPreview = document.getElementById("ecgPreview");

ecgFileInput.addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) {
    ecgPreview.innerHTML = "Chưa có ảnh ECG.";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    ecgPreview.innerHTML = "Ảnh ECG:";
    const img = document.createElement("img");
    img.src = e.target.result;
    ecgPreview.appendChild(img);
  };
  reader.readAsDataURL(file);

  await callBackendDemo(file);
});

//------------------------------------------------------
// HÀM AI DEMO - TẠO KẾT LUẬN ECG (TIẾNG VIỆT)
//------------------------------------------------------
async function callBackendDemo(file) {
  const statusBox = document.getElementById("ecgStatus");
  const summaryBox = document.getElementById("ecgTextSummary");

  statusBox.textContent = "AI đang phân tích ECG (demo)…";
  summaryBox.textContent = "Đang phân tích hình ảnh ECG…";

  await new Promise(resolve => setTimeout(resolve, 1200));

  let ischemia = false;
  let dangerousArr = false;
  let otherAbn = false;

  const age = parseInt(document.getElementById("patientAge").value) || 0;

  if (age >= 65) {
    ischemia = true;
    otherAbn = true;
  } else if (age >= 45) {
    ischemia = true;
  } else {
    otherAbn = true;
  }

  const fileName = file.name.toLowerCase();
  if (fileName.includes("vt") || fileName.includes("vf")) {
    dangerousArr = true;
    ischemia = false;
  }

  // gán hidden values
  document.getElementById("ecgIschemia").value = ischemia ? "1" : "0";
  document.getElementById("ecgDangerousRhythm").value = dangerousArr ? "1" : "0";
  document.getElementById("ecgOtherAbnormal").value = otherAbn ? "1" : "0";

  // TẠO KẾT LUẬN NGẮN GỌN
  let summary = "";
  if (dangerousArr) {
    summary =
      "⚠️ ECG gợi ý rối loạn nhịp nguy hiểm. Cần ưu tiên xử trí cấp cứu, theo dõi huyết động và xem xét chuyển tuyến.";
  } else if (ischemia) {
    summary =
      "❗ ECG nghi ngờ thiếu máu cơ tim: có biến đổi ST–T gợi ý thiếu máu dưới nội mạc. Cần phối hợp triệu chứng và men tim.";
  } else if (otherAbn) {
    summary =
      "ℹ️ ECG có bất thường nhưng không đặc hiệu thiếu máu cơ tim (có thể dày thất, block nhánh hoặc ngoại tâm thu).";
  } else {
    summary =
      "✓ ECG hiện tại không thấy dấu hiệu rõ thiếu máu cơ tim hay rối loạn nhịp ác tính. Cần theo dõi triệu chứng.";
  }

  statusBox.textContent = "Phân tích hoàn tất.";
  summaryBox.textContent = summary;
}

//------------------------------------------------------
// TÍNH TOÁN 4 MÀU – 4 MỨC CẢNH BÁO
//------------------------------------------------------
function calculateAndShowResult() {
  const bpText = document.getElementById("bp").value;
  const { sbp } = parseBloodPressure(bpText);
  const hr = parseInt(document.getElementById("hr").value);
  const rr = parseInt(document.getElementById("rr").value);
  const spo2 = parseInt(document.getElementById("spo2").value);
  const consciousness = document.getElementById("consciousness").value;

  let vitalsCritical = false;
  let vitalReasons = [];

  if (!isNaN(sbp) && sbp < 90) {
    vitalsCritical = true;
    vitalReasons.push("Huyết áp thấp (SBP < 90)");
  }
  if (!isNaN(hr) && (hr < 40 || hr > 140)) {
    vitalsCritical = true;
    vitalReasons.push("Mạch bất thường (<40 hoặc >140)");
  }
  if (!isNaN(rr) && rr > 30) {
    vitalsCritical = true;
    vitalReasons.push("Nhịp thở nhanh (>30)");
  }
  if (!isNaN(spo2) && spo2 < 90) {
    vitalsCritical = true;
    vitalReasons.push("SpO₂ thấp (<90%)");
  }
  if (consciousness !== "tinh") {
    vitalsCritical = true;
    vitalReasons.push("Tri giác giảm");
  }

  const dangerousRhythm = document.getElementById("ecgDangerousRhythm").value === "1";
  const ischemia = document.getElementById("ecgIschemia").value === "1";
  const otherAbn = document.getElementById("ecgOtherAbnormal").value === "1";

  const symptomsCount = document.querySelectorAll(".symptom:checked").length;
  const riskCount = document.querySelectorAll(".risk:checked").length;

  let riskClass = "";
  let riskTitle = "";
  let riskSubtitle = "";
  let recommendations = [];
  let vitalExplain = "";
  let rhythmExplain = "";
  let ischemiaExplain = "";
  let probability = 0;

  // === 1) ĐỎ – NGUY KỊCH ===
  if (vitalsCritical) {
    riskClass = "risk-critical";
    riskTitle = "🔴 ĐỎ – NGUY KỊCH";
    riskSubtitle = "Bệnh nhân có dấu hiệu đe dọa tính mạng.";
    vitalExplain = "AI Safety: bất thường sinh tồn: " + vitalReasons.join("; ");
    rhythmExplain = "Nhịp sẽ được đánh giá sau khi ổn định huyết động.";
    ischemiaExplain = "Không trì hoãn cấp cứu để tìm dấu thiếu máu cơ tim.";
    recommendations = [
      "Ưu tiên ABC ngay.",
      "Ổn định huyết động.",
      "Chuẩn bị chuyển tuyến khẩn."
    ];
    probability = 0.9;
  }

  // === 2) CAM – RỐI LOẠN NHỊP NGUY HIỂM ===
  else if (dangerousRhythm) {
    riskClass = "risk-arrhythmia";
    riskTitle = "🟠 CAM – RỐI LOẠN NHỊP NGUY HIỂM";
    riskSubtitle = "ECG có dấu hiệu rối loạn nhịp nguy hiểm.";
    vitalExplain = "AI Safety: chưa ghi nhận sốc nhưng cần giám sát sát.";
    rhythmExplain = "Ưu tiên xử trí nhịp trước (sốc điện/thuốc).";
    ischemiaExplain = "Thiếu máu cơ tim đánh giá sau khi kiểm soát nhịp.";
    recommendations = [
      "Xử trí theo phác đồ rối loạn nhịp.",
      "Theo dõi monitor.",
      "Hội chẩn và chuyển tuyến."
    ];
    probability = 0.85;
  }

  // === TẦNG 3 – ISCHEMIA FUSION ===
  else {
    let fusion = 0;
    if (ischemia) fusion += 4;
    fusion += symptomsCount;
    fusion += riskCount * 0.5;

    probability = Math.min(1, fusion / 11);

    vitalExplain = "AI Safety: không ghi nhận dấu hiệu nguy kịch.";
    rhythmExplain = "AI Rhythm: không có rối loạn nhịp nguy hiểm.";
    ischemiaExplain = "AI Ischemia Fusion: kết hợp ECG + triệu chứng + nguy cơ.";

    if (probability < 0.2) {
      // === 3) XANH – NGUY CƠ THẤP ===
      riskClass = "risk-low";
      riskTitle = "🟢 XANH – NGUY CƠ THẤP";
      riskSubtitle = "Chưa gợi ý thiếu máu cơ tim cấp.";
      recommendations = [
        "Theo dõi tại tuyến cơ sở.",
        "Lặp lại ECG khi triệu chứng thay đổi.",
        "Giải thích dấu hiệu nguy hiểm."
      ];
    } else {
      // === 4) VÀNG – NGUY CƠ TRUNG BÌNH/CAO ===
      riskClass = "risk-medium";
      riskTitle = "🟡 VÀNG – NGUY CƠ TRUNG BÌNH/CAO";
      riskSubtitle = "Có khả năng thiếu máu cơ tim.";
      recommendations = [
        "Theo dõi sát.",
        "Lặp lại ECG trong 10–15 phút.",
        "Hội chẩn tuyến trên.",
        "Chuẩn bị chuyển tuyến nếu xấu đi."
      ];
    }
  }

  //------------------------------------------------------
  // HIỂN THỊ KẾT QUẢ
  //------------------------------------------------------
  const probText = (probability * 100).toFixed(0) + "%";
  const resultDiv = document.getElementById("resultRiskCard");

  resultDiv.innerHTML = `
    <div class="risk-card ${riskClass}">
      <h2>${riskTitle}</h2>
      <p>${riskSubtitle}</p>
      <div class="pill">Xác suất thiếu máu cơ tim (demo): <b>${probText}</b></div>
    </div>
  `;

  document.getElementById("vitalSummary").textContent = vitalExplain;
  document.getElementById("rhythmSummary").textContent = rhythmExplain;
  document.getElementById("ischemiaSummary").textContent = ischemiaExplain;

  const recList = document.getElementById("recommendationList");
  recList.innerHTML = "";
  recommendations.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    recList.appendChild(li);
  });

  const hear = calculateHEAR();
  document.getElementById("hearSummary").innerHTML = `
    <h3>HEAR score</h3>
    <p><b>${hear.total} / 8 điểm</b></p>
    <p>History: ${hear.H}, ECG: ${hear.E}, Age: ${hear.A}, Risk: ${hear.R}</p>
  `;

  goToStep(4);
}

//------------------------------------------------------
// RESET
//------------------------------------------------------
function resetForm() {
  document.querySelectorAll("input, select").forEach(el => {
    if (el.type === "checkbox") el.checked = false;
    else if (el.tagName.toLowerCase() === "select") el.selectedIndex = 0;
    else el.value = "";
  });

  document.getElementById("ecgPreview").innerHTML = "Chưa có ảnh ECG.";
  document.getElementById("ecgStatus").textContent = "";
  document.getElementById("ecgTextSummary").textContent = "Chưa có kết quả AI.";

  goToStep(1);
}
