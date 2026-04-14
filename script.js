document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const printBtn = document.getElementById('printBtn');
    const receiptSection = document.getElementById('receiptSection');
    const errorMessage = document.getElementById('errorMessage');

    // Inputs
    const inputLandArea = document.getElementById('landArea');
    const inputTotalWeight = document.getElementById('totalWeight');
    const inputNumberOfBags = document.getElementById('numberOfBags');
    const inputReductionPerBag = document.getElementById('reductionPerBag');
    const inputReductionPer1000kg = document.getElementById('reductionPer1000kg');
    const inputTotalRate = document.getElementById('totalRate');

    // Outputs
    const outTotalWeight = document.getElementById('outTotalWeight');
    const outBags = document.getElementById('outBags');
    const outBagReduction = document.getElementById('outBagReduction');
    const outQuantaReduction = document.getElementById('outQuantaReduction');
    const outReduction = document.getElementById('outReduction');
    const outFinalWeight = document.getElementById('outFinalWeight');
    const outPricePerKg = document.getElementById('outPricePerKg');
    const outTotalAmount = document.getElementById('outTotalAmount');
    const outAmountInWords = document.getElementById('outAmountInWords');
    const outPutti = document.getElementById('outPutti');
    const outYieldPerAcre = document.getElementById('outYieldPerAcre');
    const outYield = document.getElementById('outYield');
    const yieldProgress = document.getElementById('yieldProgress');
    const receiptDate = document.getElementById('receiptDate');

    // Set today's date format
    const updateDate = () => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        receiptDate.textContent = new Date().toLocaleDateString('en-IN', options);
    };
    updateDate();

    // Format currency in Indian Rupees
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Convert number to Indian words
    const numberToWords = (num) => {
        const integerPart = Math.floor(Math.abs(num));
        const fractionalPart = Math.round((Math.abs(num) - integerPart) * 100);
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if (n === 0) return '';
            let str = '';
            if (n > 99) {
                str += a[Math.floor(n / 100)] + 'Hundred ';
                n %= 100;
            }
            if (n > 19) {
                str += b[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) {
                str += a[n];
            }
            return str.trim();
        };

        const convert = (num) => {
            if (num === 0) return 'Zero';
            let str = '';
            const crore = Math.floor(num / 10000000);
            num %= 10000000;
            const lakh = Math.floor(num / 100000);
            num %= 100000;
            const thousand = Math.floor(num / 1000);
            num %= 1000;

            if (crore > 0) str += inWords(crore) + ' Crore ';
            if (lakh > 0) str += inWords(lakh) + ' Lakh ';
            if (thousand > 0) str += inWords(thousand) + ' Thousand ';
            if (num > 0) str += inWords(num);
            return str.trim();
        };

        let result = convert(integerPart) + ' Rupees';
        if (fractionalPart > 0) {
            result += ' and ' + convert(fractionalPart) + ' Paise';
        }
        return result + ' Only';
    };

    calculateBtn.addEventListener('click', () => {
        // Reset Error
        errorMessage.textContent = '';
        errorMessage.style.opacity = '0';

        // Get values with strict fallbacks so empty strings or missing data don't break the calculator
        const landArea = parseFloat(inputLandArea.value) || 0;
        const totalWeight = parseFloat(inputTotalWeight.value) || 0;
        const bags = parseInt(inputNumberOfBags.value) || 0;
        const reductionPerBag = parseFloat(inputReductionPerBag.value) || 0;
        const reductionPer1000kg = parseFloat(inputReductionPer1000kg.value) || 0;
        const totalRate = parseFloat(inputTotalRate.value) || 0;

        // Validation - stricter limits. Allowed 0 for bags and reductions for manual loose paddy.
        if (landArea <= 0 || totalWeight <= 0 || totalRate <= 0 || bags < 0 || reductionPerBag < 0 || reductionPer1000kg < 0) {
            errorMessage.textContent = 'Please enter valid numerical values. Land Area, Weight, and Rate must be > 0.';
            errorMessage.style.opacity = '1';
            receiptSection.classList.remove('show-receipt');
            setTimeout(() => { receiptSection.classList.add('hidden'); }, 300);
            return;
        }

        // Calculations - using Number and toFixed strictly prevents floating point inaccuracies which causes mismatched answers compared to a mobile calculator
        const reductionFromBags = Number((bags * reductionPerBag).toFixed(3));
        const reductionFromQuanta = Number(((totalWeight / 1000) * reductionPer1000kg).toFixed(3));
        const totalReduction = Number((reductionFromBags + reductionFromQuanta).toFixed(3));
        const finalWeight = Number((totalWeight - totalReduction).toFixed(3));

        if (finalWeight <= 0) {
            errorMessage.textContent = 'Total reduction cannot be greater than or equal to total net weight.';
            errorMessage.style.opacity = '1';
            receiptSection.classList.remove('show-receipt');
            setTimeout(() => { receiptSection.classList.add('hidden'); }, 300);
            return;
        }

        // Calculate Putti Value mathematically
        const puttiVal = Number((finalWeight / 856).toFixed(4));
        
        // Farmers multiply the visible price per kg by the final weight on their mobile calculators.
        // If we use hidden decimal precision, the answer mismatches the manual calculator result.
        // Fix: Force pricePerKg to strictly 2 decimal places (Paise level) and calculate total amount from it.
        const pricePerKgStr = (totalRate / 856).toFixed(2);
        const pricePerKg = Number(pricePerKgStr);
        
        const totalAmount = Number((finalWeight * pricePerKg).toFixed(2));

        // Determine yield level and progress bar
        let yieldText = '';
        let yieldClass = '';
        let progressPercent = 0;
        
        const puttiPerAcre = puttiVal / landArea;

        // Assuming max typical yield for progress bar visual is around 5 Putti/Acre
        progressPercent = Math.min((puttiPerAcre / 5) * 100, 100);

        if (puttiPerAcre < 2.5) {
            yieldText = 'Low / Bad Yield';
            yieldClass = 'low';
        } else if (puttiPerAcre >= 2.5 && puttiPerAcre <= 3.5) {
            yieldText = 'Normal Yield';
            yieldClass = 'medium';
        } else {
            yieldText = 'Good Yield';
            yieldClass = 'high';
        }

        // Add a micro-animation to the calculate button
        const btnText = calculateBtn.querySelector('.btn-text');
        const btnIcon = calculateBtn.querySelector('i');
        
        btnText.textContent = 'Calculating...';
        btnIcon.className = 'fa-solid fa-spinner fa-spin';
        calculateBtn.disabled = true;
        calculateBtn.style.opacity = '0.8';
        
        // Simulate minor delay for calculation effect (UX purpose)
        setTimeout(() => {
            // Update UI
            outTotalWeight.textContent = `${totalWeight.toFixed(2)} kg`;
            outBags.textContent = bags;
            if (outBagReduction) outBagReduction.textContent = `- ${reductionFromBags.toFixed(2)} kg`;
            if (outQuantaReduction) outQuantaReduction.textContent = `- ${reductionFromQuanta.toFixed(2)} kg`;
            outReduction.textContent = `- ${totalReduction.toFixed(2)} kg`;
            outFinalWeight.textContent = `${finalWeight.toFixed(2)} kg`;
            outPricePerKg.textContent = formatCurrency(pricePerKg) + ' /kg';
            outTotalAmount.textContent = formatCurrency(totalAmount);
            outAmountInWords.textContent = numberToWords(totalAmount);
            outPutti.textContent = `${puttiVal.toFixed(2)} Putti`;
            outYieldPerAcre.textContent = `${puttiPerAcre.toFixed(2)} Putti/Acre`;
            
            outYield.textContent = yieldText;
            outYield.className = `badge ${yieldClass}`;
            
            yieldProgress.className = `progress ${yieldClass}`;
            yieldProgress.style.width = '0%'; // Reset for animation

            updateDate();

            // Show receipt
            receiptSection.classList.remove('hidden');
            
            // Trigger reflow for animation
            void receiptSection.offsetWidth;
            
            receiptSection.classList.add('show-receipt');
            
            setTimeout(() => {
                yieldProgress.style.width = `${progressPercent}%`;
            }, 300);

            // Scroll to receipt slightly if on mobile
            if (window.innerWidth < 768) {
                setTimeout(() => {
                    receiptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            }
            
            // Reset button
            btnText.textContent = 'Calculate Again';
            btnIcon.className = 'fa-solid fa-rotate-right';
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
            
        }, 600); // 600ms fake delay to show spinner and UX
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });
});