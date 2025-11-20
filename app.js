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

  // giả lập trễ ~1.2s
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

  document.getElementById("ecgIschemia").value = ischemia ? "1" : "0";
  document.getElementById("ecgDangerousRhythm").value = dangerousArr ? "1" : "0";
  document.getElementById("ecgOtherAbnormal").value = otherAbn ? "1" : "0";

  let summary = "";
  if (dangerousArr) {
    summary =
      "⚠️ ECG gợi ý rối loạn nhịp nguy hiểm. Cần ưu tiên xử trí cấp cứu, theo dõi huyết động và xem xét chuyển tuyến.";
  } else if (ischemia) {
    summary =
      "❗ ECG nghi ngờ thiếu máu cơ tim: có biến đổi ST–T gợi ý thiếu máu cơ tim. Cần phối hợp triệu chứng và men tim.";
  } else if (otherAbn) {
    summary =
      "ℹ️ ECG có bất thường nhưng không đặc hiệu thiếu máu cơ tim (có thể dày thất, block nhánh hoặc ngoại tâm thu).";
  } else {
    summary =
      "✓ ECG hiện tại chưa thấy dấu hiệu rõ thiếu máu cơ tim hay rối loạn nhịp ác tính. Cần theo dõi triệu chứng và lặp lại ECG khi cần.";
  }

  statusBox.textContent = "Phân tích hoàn tất (demo).";
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
  let probability = 0;

  // 1) ĐỎ – NGUY KỊCH
  if (vitalsCritical) {
    riskClass = "risk-critical";
    riskTitle = "🔴 ĐỎ – NGUY KỊCH";
    riskSubtitle = "Bệnh nhân có dấu hiệu đe doạ tính mạng, cần cấp cứu ngay.";
    recommendations = [
      "Ưu tiên ABC (đường thở – hô hấp – tuần hoàn).",
      "Ổn định huyết động nhanh nhất có thể.",
      "Liên hệ và chuyển tuyến khẩn đến cơ sở có hồi sức/can thiệp.",
      "Theo dõi sát trên đường vận chuyển."
    ];
    probability = 0.9;
  }
  // 2) CAM – RỐI LOẠN NHỊP NGUY HIỂM
  else if (dangerousRhythm) {
    riskClass = "risk-arrhythmia";
    riskTitle = "🟠 CAM – RỐI LOẠN NHỊP NGUY HIỂM";
    riskSubtitle = "ECG có dấu hiệu rối loạn nhịp nguy hiểm.";
    recommendations = [
      "Xử trí rối loạn nhịp theo phác đồ (sốc điện/thuốc).",
      "Theo dõi huyết động và nhịp tim liên tục.",
      "Hội chẩn tuyến trên sớm.",
      "Chuyển tuyến cấp cứu đến cơ sở có khả năng hồi sức."
    ];
    probability = 0.85;
  }
  // 3+4) VÀNG / XANH – THIẾU MÁU CƠ TIM
  else {
    let fusion = 0;
    if (ischemia) fusion += 4;
    fusion += symptomsCount;
    fusion += riskCount * 0.5;

    probability = Math.min(1, fusion / 11);

    if (probability < 0.2) {
      riskClass = "risk-low";
      riskTitle = "🟢 XANH – NGUY CƠ THIẾU MÁU CƠ TIM THẤP";
      riskSubtitle = "Hiện ít gợi ý thiếu máu cơ tim cấp, có thể theo dõi tại tuyến cơ sở.";
      recommendations = [
        "Theo dõi triệu chứng và chỉ số sinh tồn tại tuyến cơ sở.",
        "Lặp lại ECG nếu triệu chứng xuất hiện hoặc thay đổi.",
        "Khám chuyên khoa tim mạch khi thuận tiện.",
        "Giải thích cho người bệnh các dấu hiệu nguy hiểm cần quay lại ngay."
      ];
    } else {
      riskClass = "risk-medium";
      riskTitle = "🟡 VÀNG – NGUY CƠ THIẾU MÁU CƠ TIM TRUNG BÌNH/CAO";
      riskSubtitle = "Có khả năng thiếu máu cơ tim, cần theo dõi sát và cân nhắc chuyển tuyến.";
      recommendations = [
        "Theo dõi sát triệu chứng và huyết động.",
        "Lặp lại ECG sau 10–15 phút hoặc khi triệu chứng thay đổi.",
        "Hội chẩn tuyến trên (trực tiếp hoặc từ xa).",
        "Chuẩn bị chuyển tuyến nếu triệu chứng không cải thiện hoặc nặng lên."
      ];
    }
  }

  // HIỂN THỊ CARD MÀU
  const probText = (probability * 100).toFixed(0) + "%";
  const resultDiv = document.getElementById("resultRiskCard");
  resultDiv.innerHTML = `
    <div class="risk-card ${riskClass}">
      <h2>${riskTitle}</h2>
      <p>${riskSubtitle}</p>
      <div class="pill">Xác suất thiếu máu cơ tim (ước tính demo): <b>${probText}</b></div>
    </div>
  `;

  // KHUNG KHUYẾN CÁO CÙNG MÀU
  const recBox = document.getElementById("recommendationBox");
  recBox.className = "recommend-box " + riskClass;

  const recList = document.getElementById("recommendationList");
  recList.innerHTML = "";
  recommendations.forEach(r => {
    const li = document.createElement("li");
    li.textContent = r;
    recList.appendChild(li);
  });

  // HEAR SCORE BÊN CẠNH
  const hear = calculateHEAR();
  const hearDiv = document.getElementById("hearSummary");
  hearDiv.className = "hear-card";
  hearDiv.innerHTML = `
    <h3>HEAR score</h3>
    <p><b>Tổng điểm: ${hear.total} / 8</b></p>
    <p>History: ${hear.H} • ECG: ${hear.E} • Age: ${hear.A} • Risk: ${hear.R}</p>
    <p style="font-size:11px;color:#4b5563;margin-top:6px;">
      HEAR chỉ mang tính tham khảo, không thay thế phân tầng 4 màu của AI.
    </p>
  `;

  goToStep(4);
}

//------------------------------------------------------
// RESET FORM
//------------------------------------------------------
function resetForm() {
  document.querySelectorAll("input, select").forEach(el => {
    if (el.type === "checkbox") el.checked = false;
    else if (el.tagName.toLowerCase() === "select") el.selectedIndex = 0;
    else el.value = "";
  });

  document.getElementById("ecgPreview").innerHTML = "Chưa có ảnh ECG.";
  document.getElementById("ecgStatus").textContent = "Chưa phân tích. Vui lòng tải ECG.";
  document.getElementById("ecgTextSummary").textContent = "Chưa có kết quả AI.";

  document.getElementById("resultRiskCard").innerHTML = "";
  document.getElementById("recommendationBox").className = "recommend-box";
  document.getElementById("recommendationList").innerHTML = "";
  document.getElementById("hearSummary").innerHTML = "";

  goToStep(1);
}
