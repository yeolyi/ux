class Calculator {
  constructor() {
    this.display = "0";
    this.previousValue = null;
    this.operation = null;
    this.waitingForNewValue = false;

    this.displayElement = document.querySelector(".result");
    this.calculationElement = document.querySelector(".calculation");

    this.initializeEventListeners();
    this.updateDisplay();
  }

  initializeEventListeners() {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach((button) => {
      button.addEventListener("click", this.handleButtonClick.bind(this));
    });
  }

  handleButtonClick(event) {
    const button = event.target;

    if (button.dataset.number) {
      this.inputNumber(button.dataset.number);
    } else if (button.dataset.action) {
      this.handleAction(button.dataset.action);
    }

    this.updateDisplay();
  }

  inputNumber(num) {
    if (this.waitingForNewValue) {
      this.display = num;
      this.waitingForNewValue = false;
    } else {
      this.display = this.display === "0" ? num : this.display + num;
    }
    this.updateDisplay();
  }

  handleAction(action) {
    const current = parseFloat(this.display);

    switch (action) {
      case "clear":
        this.clear();
        break;
      case "clear-entry":
        this.clearEntry();
        break;
      case "percent":
        this.display = String(current / 100);
        break;
      case "toggle-sign":
        this.display = String(current * -1);
        break;
      case "decimal":
        this.inputDecimal();
        break;
      case "add":
      case "subtract":
      case "multiply":
      case "divide":
        this.setOperation(action, current);
        break;
      case "equals":
        this.calculate();
        break;
    }
  }

  clear() {
    this.display = "0";
    this.previousValue = null;
    this.operation = null;
    this.waitingForNewValue = false;
    this.calculationElement.textContent = "0";
    this.clearActiveOperator();
  }

  clearEntry() {
    if (this.display.length > 1) {
      this.display = this.display.slice(0, -1);
    } else {
      this.display = "0";
    }
  }

  inputDecimal() {
    if (!this.display.includes(".")) {
      this.display += ".";
    }
  }

  setOperation(nextOperation, current) {
    if (this.previousValue === null) {
      this.previousValue = current;
    } else if (this.operation) {
      const result = this.performCalculation();
      this.display = String(result);
      this.previousValue = result;
    }

    this.waitingForNewValue = true;
    this.operation = nextOperation;
    this.updateCalculationDisplay();
    this.setActiveOperator(nextOperation);
  }

  calculate() {
    // 결제 상태 확인
    if (this.shouldShowPaymentModal()) {
      this.showPaymentModal();
      return;
    }

    // 일반 계산 수행
    this.performFinalCalculation();
  }

  shouldShowPaymentModal() {
    const savedData = localStorage.getItem("calculatorPayment");
    if (savedData) {
      const paymentData = JSON.parse(savedData);
      return !paymentData.isPaid;
    }
    return true; // 결제 정보가 없으면 결제 모달 표시
  }

  performFinalCalculation() {
    const current = parseFloat(this.display);

    if (this.previousValue !== null && this.operation) {
      const result = this.performCalculation(
        this.previousValue,
        current,
        this.operation
      );
      this.display = String(result);
      this.previousValue = null;
      this.operation = null;
      this.waitingForNewValue = true;
    }

    this.calculationElement.textContent = "0";
    this.clearActiveOperator();
  }

  performCalculation(
    prev = this.previousValue,
    current = parseFloat(this.display),
    operation = this.operation
  ) {
    switch (operation) {
      case "add":
        return prev + current;
      case "subtract":
        return prev - current;
      case "multiply":
        return prev * current;
      case "divide":
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  }

  updateDisplay() {
    this.displayElement.textContent = this.formatNumber(this.display);
  }

  updateCalculationDisplay() {
    const operatorSymbols = {
      add: "+",
      subtract: "−",
      multiply: "×",
      divide: "÷",
    };

    if (this.previousValue !== null && this.operation) {
      this.calculationElement.textContent = `${this.formatNumber(
        this.previousValue
      )} ${operatorSymbols[this.operation]}`;
    }
  }

  formatNumber(number) {
    const num = parseFloat(number);
    if (isNaN(num)) return "0";

    if (num % 1 === 0) {
      return num.toLocaleString();
    }

    return parseFloat(num.toPrecision(12)).toString();
  }

  setActiveOperator(operator) {
    this.clearActiveOperator();
    const operatorButton = document.querySelector(
      `[data-action="${operator}"]`
    );
    if (operatorButton) {
      operatorButton.classList.add("active");
    }
  }

  clearActiveOperator() {
    const activeOperator = document.querySelector(".btn.operator.active");
    if (activeOperator) {
      activeOperator.classList.remove("active");
    }
  }

  showPaymentModal() {
    const modal = document.getElementById("payment-modal");
    modal.classList.add("show");

    // 현재 계산 상태를 저장 (등호 버튼 누르기 직전 상태)
    const savedState = {
      display: this.display,
      previousValue: this.previousValue,
      operation: this.operation,
      waitingForNewValue: this.waitingForNewValue,
    };

    // 모달이 닫힐 때 저장된 상태로 복원
    window.paymentModalResult = () => {
      this.display = savedState.display;
      this.previousValue = savedState.previousValue;
      this.operation = savedState.operation;
      this.waitingForNewValue = savedState.waitingForNewValue;
      this.updateDisplay();
      this.updateCalculationDisplay();
      this.setActiveOperator(this.operation);
    };
  }
}

class PaymentSystem {
  constructor() {
    this.selectedPlan = null;
    this.selectedPaymentMethod = "card"; // 기본값으로 카드 선택
    this.isProcessingPayment = false;
    this.cancelCountdownInterval = null; // 해지 카운트다운 타이머
    this.termsScrollHandler = null; // 약관 스크롤 핸들러
    this.initializeEventListeners();
    this.loadPaymentState();
  }

  initializeEventListeners() {
    // 모달 제어
    document
      .getElementById("close-modal")
      .addEventListener("click", () => this.closeModal());
    document.getElementById("payment-modal").addEventListener("click", (e) => {
      if (e.target.id === "payment-modal" && !this.isProcessingPayment) {
        this.closeModal();
      }
    });

    // 플랜 선택
    document.querySelectorAll(".plan").forEach((plan) => {
      plan.addEventListener("click", (e) => this.selectPlan(e));
    });

    // 네비게이션
    document
      .getElementById("continue-to-payment")
      .addEventListener("click", () => this.showPaymentMethod());
    document
      .getElementById("back-to-plan")
      .addEventListener("click", () => this.showPlanSelection());

    // 결제 처리
    document
      .getElementById("process-payment")
      .addEventListener("click", () => this.processPayment());
    document
      .getElementById("close-payment")
      .addEventListener("click", () => this.closeModalWithResult());

    // 구독해지 모달 제어
    const cancelModal = document.getElementById("cancel-subscription-modal");
    if (cancelModal) {
      cancelModal.addEventListener("click", (e) => {
        if (e.target.id === "cancel-subscription-modal") {
          this.closeCancelSubscriptionModal();
        }
      });

      document
        .getElementById("close-cancel-modal")
        .addEventListener("click", () => {
          this.closeCancelSubscriptionModal();
        });

      // 해지 이유 선택
      const reasonInputs = document.querySelectorAll(
        'input[name="cancel-reason"]'
      );
      reasonInputs.forEach((input) => {
        input.addEventListener("change", () => {
          this.updateCancelButtonStates();
        });
      });

      // 다음 단계로 이동
      document
        .getElementById("continue-cancel")
        .addEventListener("click", () => {
          this.showDiscountOffer();
        });

      // 할인 수락
      document
        .getElementById("accept-discount")
        .addEventListener("click", () => {
          this.processDiscount();
        });

      // 네트워크 오류 모달 제어
      const errorModal = document.getElementById("network-error-modal");
      if (errorModal) {
        errorModal.addEventListener("click", (e) => {
          if (e.target.id === "network-error-modal") {
            this.closeNetworkErrorModal();
          }
        });

        document
          .getElementById("close-error-modal-btn")
          .addEventListener("click", () => {
            this.closeNetworkErrorModal();
          });

        document
          .getElementById("close-error-modal-x")
          .addEventListener("click", () => {
            this.closeNetworkErrorModal();
          });
      }

      // 할인 거절
      document
        .getElementById("decline-discount")
        .addEventListener("click", () => {
          this.showTermsAgreement();
        });

      // 약관 동의 단계
      document
        .getElementById("cancel-terms-back")
        .addEventListener("click", () => {
          this.showDiscountOffer();
        });

      document
        .getElementById("agree-terms-continue")
        .addEventListener("click", () => {
          this.showFinalConfirm();
        });

      // 최종 해지 확인
      document
        .getElementById("confirm-cancel")
        .addEventListener("click", () => {
          this.processCancelSubscription();
        });

      // 취소 버튼들
      document.getElementById("cancel-cancel").addEventListener("click", () => {
        this.closeCancelSubscriptionModal();
      });

      document
        .getElementById("cancel-cancel-final")
        .addEventListener("click", () => {
          this.closeCancelSubscriptionModal();
        });
    }
  }

  selectPlan(event) {
    // 기존 선택 해제
    document.querySelectorAll(".plan").forEach((plan) => {
      plan.classList.remove("selected");
    });

    // 새 플랜 선택
    event.currentTarget.classList.add("selected");
    this.selectedPlan = event.currentTarget.dataset.plan;

    // 계속하기 버튼 활성화
    document.getElementById("continue-to-payment").disabled = false;
  }

  showPaymentMethod() {
    document.getElementById("plan-selection").classList.add("hidden");
    document.getElementById("payment-method").classList.remove("hidden");

    // 선택된 플랜 정보 표시
    const planInfo = this.getPlanInfo(this.selectedPlan);
    document.getElementById("selected-plan-info").innerHTML = `
            <h4>${planInfo.name}</h4>
            <p><strong>${planInfo.price}</strong></p>
            <p>${planInfo.description}</p>
        `;

    // 결제 버튼 활성화 (카드는 이미 선택됨)
    document.getElementById("process-payment").disabled = false;
  }

  showPlanSelection() {
    document.getElementById("payment-method").classList.add("hidden");
    document.getElementById("plan-selection").classList.remove("hidden");
    document.getElementById("process-payment").disabled = true;
  }

  async processPayment() {
    const payButton = document.getElementById("process-payment");
    const backButton = document.getElementById("back-to-plan");
    const closeButton = document.getElementById("close-modal");

    // UI 비활성화
    this.disablePaymentUI(payButton, backButton, closeButton);

    try {
      // 결제 처리 시뮬레이션
      await this.simulatePayment();

      // 결제 성공 처리
      this.handlePaymentSuccess();
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      // UI 복원
      this.enablePaymentUI(payButton, backButton, closeButton);
    }
  }

  disablePaymentUI(payButton, backButton, closeButton) {
    this.isProcessingPayment = true;
    payButton.classList.add("loading");
    payButton.disabled = true;
    backButton.disabled = true;
    closeButton.style.pointerEvents = "none";
    closeButton.style.opacity = "0.5";
  }

  enablePaymentUI(payButton, backButton, closeButton) {
    this.isProcessingPayment = false;
    payButton.classList.remove("loading");
    payButton.disabled = false;
    backButton.disabled = false;
    closeButton.style.pointerEvents = "auto";
    closeButton.style.opacity = "1";
  }

  simulatePayment() {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  }

  handlePaymentSuccess() {
    // 결제 정보 저장
    this.savePaymentState();

    // 구독 상태 즉시 표시
    const savedData = localStorage.getItem("calculatorPayment");
    if (savedData) {
      const paymentData = JSON.parse(savedData);
      this.displayPaymentStatus(paymentData);
    }

    // 성공 화면으로 이동
    document.getElementById("payment-method").classList.add("hidden");
    document.getElementById("payment-success").classList.remove("hidden");
  }

  getPlanInfo(planType) {
    const plans = {
      monthly: {
        name: "Basic 요금제",
        price: "월 9,900원",
        description: "기본 기능 + 계산 히스토리 저장",
      },
      yearly: {
        name: "Pro 요금제",
        price: "연 99,000원",
        description: "전체 기능 + 2개월 무료 사용",
      },
      lifetime: {
        name: "Premium 요금제",
        price: "평생 199,000원",
        description: "모든 기능 + 평생 무료 업데이트",
      },
    };
    return plans[planType] || plans.monthly;
  }

  savePaymentState() {
    const paymentData = {
      plan: this.selectedPlan,
      paymentMethod: this.selectedPaymentMethod,
      paymentDate: new Date().toISOString(),
      isPaid: true,
      planInfo: this.getPlanInfo(this.selectedPlan),
    };

    localStorage.setItem("calculatorPayment", JSON.stringify(paymentData));
  }

  loadPaymentState() {
    try {
      const savedData = localStorage.getItem("calculatorPayment");
      if (savedData) {
        const paymentData = JSON.parse(savedData);
        if (paymentData.isPaid) {
          this.displayPaymentStatus(paymentData);
        }
      }
    } catch (error) {
      console.error("결제 정보 로드 오류:", error);
    }
  }

  displayPaymentStatus(paymentData) {
    const calculator = document.querySelector(".calculator");
    const statusElement = document.createElement("div");
    statusElement.className = "payment-status";
    statusElement.innerHTML = `
            <div style="color: #ff9500; font-size: 12px; text-align: left; margin-bottom: 10px; padding: 8px; background-color: rgba(255, 149, 0, 0.1); border-radius: 8px; border: 1px solid #ff9500; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <span style="flex: 1;">✨ Calculator Pro 활성화됨</span>
                <button class="cancel-subscription-btn" id="cancel-subscription-btn">
                    구독해지
                </button>
            </div>
        `;

    // 기존 상태 표시 제거
    const existingStatus = calculator.querySelector(".payment-status");
    if (existingStatus) {
      existingStatus.remove();
    }

    // 새 상태 표시 추가
    const display = calculator.querySelector(".display");
    calculator.insertBefore(statusElement, display);

    // 구독해지 버튼 이벤트 리스너 추가
    const cancelBtn = document.getElementById("cancel-subscription-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.showCancelSubscriptionModal();
      });
    }
  }

  closeModal() {
    if (this.isProcessingPayment) {
      return; // 결제 진행 중에는 모달을 닫을 수 없음
    }
    const modal = document.getElementById("payment-modal");
    modal.classList.remove("show");
    this.resetModal();
  }

  closeModalWithResult() {
    this.closeModal();
    if (window.paymentModalResult) {
      window.paymentModalResult();
    }
  }

  resetModal() {
    // 모든 단계를 첫 번째로 리셋
    document.querySelectorAll(".payment-step").forEach((step) => {
      step.classList.add("hidden");
    });
    document.getElementById("plan-selection").classList.remove("hidden");

    // 선택 상태 초기화
    document.querySelectorAll(".plan").forEach((plan) => {
      plan.classList.remove("selected");
    });

    this.selectedPlan = null;

    // 버튼 상태 초기화
    document.getElementById("continue-to-payment").disabled = true;
    document.getElementById("process-payment").disabled = true;
  }

  // 개발자 도구용 함수
  clearPaymentState() {
    localStorage.removeItem("calculatorPayment");
    const statusElement = document.querySelector(".payment-status");
    if (statusElement) {
      statusElement.remove();
    }
  }

  showCancelSubscriptionModal() {
    const modal = document.getElementById("cancel-subscription-modal");
    modal.classList.add("show");
    this.resetCancelModal();
    // 모달이 열릴 때 버튼 상태 확인
    this.updateCancelButtonStates();
  }

  resetCancelModal() {
    // 카운트다운 타이머 정리
    if (this.cancelCountdownInterval) {
      clearInterval(this.cancelCountdownInterval);
      this.cancelCountdownInterval = null;
    }

    // 모든 단계를 첫 번째로 리셋
    document.getElementById("cancel-reason-step").classList.remove("hidden");
    document.getElementById("discount-offer-step").classList.add("hidden");
    document.getElementById("terms-agreement-step").classList.add("hidden");
    document.getElementById("final-confirm-step").classList.add("hidden");

    // 라디오 버튼 초기화
    document
      .querySelectorAll('input[name="cancel-reason"]')
      .forEach((input) => {
        input.checked = false;
      });

    // 해지하기 버튼 초기화
    const confirmBtn = document.getElementById("confirm-cancel");
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "그래도 해지하기";
    }

    // 약관 상태 초기화
    this.resetTermsState();
  }

  updateCancelButtonStates() {
    // 첫 번째 단계의 다음 버튼 상태 확인
    const continueBtn = document.getElementById("continue-cancel");
    if (continueBtn) {
      const hasSelectedReason =
        document.querySelector(
          "#cancel-reason-step:not(.hidden) input[name='cancel-reason']:checked"
        ) !== null;
      continueBtn.disabled = !hasSelectedReason;
    }
  }

  showDiscountOffer() {
    document.getElementById("cancel-reason-step").classList.add("hidden");
    document.getElementById("terms-agreement-step").classList.add("hidden");
    document.getElementById("discount-offer-step").classList.remove("hidden");
    // 약관 관련 상태 초기화
    this.resetTermsState();
  }

  showTermsAgreement() {
    document.getElementById("discount-offer-step").classList.add("hidden");
    document.getElementById("terms-agreement-step").classList.remove("hidden");
    // 약관 스크롤 감지 시작
    this.initTermsScrollDetection();
  }

  resetTermsState() {
    // 기존 스크롤 핸들러 제거
    const termsContainer = document.querySelector(".terms-container");
    if (termsContainer && this.termsScrollHandler) {
      termsContainer.removeEventListener("scroll", this.termsScrollHandler);
      this.termsScrollHandler = null;
    }

    // 약관 스크롤 위치 초기화
    if (termsContainer) {
      termsContainer.scrollTop = 0;
    }

    // 체크박스 초기화
    const checkbox = document.getElementById("terms-agreement-checkbox");
    if (checkbox) {
      checkbox.checked = false;
      checkbox.disabled = true;
    }

    // 동의 버튼 초기화
    const agreeBtn = document.getElementById("agree-terms-continue");
    if (agreeBtn) {
      agreeBtn.disabled = true;
    }
  }

  initTermsScrollDetection() {
    const termsContainer = document.querySelector(".terms-container");
    const agreeBtn = document.getElementById("agree-terms-continue");
    const checkbox = document.getElementById("terms-agreement-checkbox");

    if (!termsContainer || !agreeBtn || !checkbox) return;

    // 기존 핸들러가 있으면 제거
    if (this.termsScrollHandler) {
      termsContainer.removeEventListener("scroll", this.termsScrollHandler);
    }

    // 초기 상태: 버튼 비활성화, 체크박스 비활성화
    agreeBtn.disabled = true;
    checkbox.disabled = true;
    checkbox.checked = false;

    // 체크박스 변경 이벤트 (한 번만 등록)
    const checkboxHandler = () => {
      agreeBtn.disabled = !checkbox.checked;
    };

    // 기존 이벤트 리스너 제거 후 재등록
    checkbox.removeEventListener("change", checkboxHandler);
    checkbox.addEventListener("change", checkboxHandler);

    this.termsScrollHandler = () => {
      const scrollTop = termsContainer.scrollTop;
      const scrollHeight = termsContainer.scrollHeight;
      const clientHeight = termsContainer.clientHeight;

      // 스크롤이 끝에 도달했는지 확인 (5px 여유)
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        // 스크롤이 끝에 도달하면 체크박스 활성화
        checkbox.disabled = false;
        termsContainer.removeEventListener("scroll", this.termsScrollHandler);
        this.termsScrollHandler = null;
      }
    };

    // 스크롤 이벤트 리스너 추가
    termsContainer.addEventListener("scroll", this.termsScrollHandler);

    // 초기 체크 (이미 스크롤이 끝에 있는 경우)
    setTimeout(() => {
      if (this.termsScrollHandler) {
        this.termsScrollHandler();
      }
    }, 100);
  }

  showFinalConfirm() {
    document.getElementById("terms-agreement-step").classList.add("hidden");
    document.getElementById("final-confirm-step").classList.remove("hidden");
    // 60초 카운트다운 시작
    this.startCancelCountdown();
  }

  startCancelCountdown() {
    const confirmBtn = document.getElementById("confirm-cancel");
    if (!confirmBtn) return;

    // 기존 타이머가 있으면 정리
    if (this.cancelCountdownInterval) {
      clearInterval(this.cancelCountdownInterval);
      this.cancelCountdownInterval = null;
    }

    let countdown = 10;
    confirmBtn.disabled = true;
    confirmBtn.textContent = `그래도 해지하기(${countdown})`;

    this.cancelCountdownInterval = setInterval(() => {
      countdown--;
      confirmBtn.textContent = `그래도 해지하기(${countdown})`;

      if (countdown <= 0) {
        clearInterval(this.cancelCountdownInterval);
        this.cancelCountdownInterval = null;
        confirmBtn.disabled = false;
        confirmBtn.textContent = "그래도 해지하기";
      }
    }, 1000);
  }

  closeCancelSubscriptionModal() {
    const modal = document.getElementById("cancel-subscription-modal");
    modal.classList.remove("show");
    // 카운트다운 타이머 정리
    if (this.cancelCountdownInterval) {
      clearInterval(this.cancelCountdownInterval);
      this.cancelCountdownInterval = null;
    }
    this.resetCancelModal();
  }

  async processCancelSubscription() {
    const confirmBtn = document.getElementById("confirm-cancel");

    // 버튼 비활성화 및 로딩 상태
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.classList.add("loading");
    }

    try {
      // 해지 처리 시뮬레이션 (2-3초)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 구독 해지 처리
      this.clearPaymentState();
      this.closeCancelSubscriptionModal();

      // 페이지 새로고침으로 상태 업데이트
      window.location.reload();
    } catch (error) {
      // 로딩 상태 제거
      if (confirmBtn) {
        confirmBtn.classList.remove("loading");
        confirmBtn.disabled = false;
      }
    }
  }

  async processDiscount() {
    const acceptBtn = document.getElementById("accept-discount");
    const declineBtn = document.getElementById("decline-discount");

    // 버튼 비활성화 및 로딩 상태
    acceptBtn.disabled = true;
    declineBtn.disabled = true;
    acceptBtn.classList.add("loading");

    try {
      // 할인 적용 시뮬레이션 (2-3초)
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 네트워크 오류 발생 시뮬레이션
      throw new Error("Network error");
    } catch (error) {
      // 로딩 상태 제거
      acceptBtn.classList.remove("loading");
      acceptBtn.disabled = false;
      declineBtn.disabled = false;

      // 네트워크 오류 모달 표시
      this.showNetworkErrorModal();
    }
  }

  showNetworkErrorModal(isCancelFlow = false) {
    const modal = document.getElementById("network-error-modal");
    const errorTexts = modal.querySelectorAll(".error-text");
    const subtitle = modal.querySelector(".modal-subtitle");

    if (isCancelFlow && errorTexts.length >= 2) {
      // 해지 플로우인 경우 메시지 수정
      if (subtitle) {
        subtitle.textContent = "구독 해지 처리 중 문제가 발생했습니다";
      }
      errorTexts[0].textContent =
        "해지 약관 동의까지는 완료되었으나, 일시적인 네트워크 오류로 해지 처리를 완료할 수 없습니다.";
    } else if (errorTexts.length >= 2) {
      // 할인 플로우인 경우 원래 메시지
      if (subtitle) {
        subtitle.textContent = "할인 적용 중 문제가 발생했습니다";
      }
      errorTexts[0].textContent =
        "일시적인 네트워크 오류로 할인을 적용할 수 없습니다.";
      errorTexts[1].textContent = "잠시 후 다시 시도해주세요.";
    }

    modal.classList.add("show");
  }

  closeNetworkErrorModal() {
    const modal = document.getElementById("network-error-modal");
    modal.classList.remove("show");
    // 구독 해지 플로우 종료
    this.closeCancelSubscriptionModal();
  }
}

// 앱 초기화
class App {
  constructor() {
    this.calculator = null;
    this.paymentSystem = null;
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.calculator = new Calculator();
      this.paymentSystem = new PaymentSystem();

      // 전역 접근을 위한 설정
      window.calculator = this.calculator;
      window.paymentSystem = this.paymentSystem;
    });
  }
}

// 앱 시작
new App();
