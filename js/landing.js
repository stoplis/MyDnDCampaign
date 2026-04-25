const overlay = document.getElementById('overlay');
        const pw = document.getElementById('pw');

        document.getElementById('dm-screen-btn').addEventListener('click', () => {
            overlay.classList.add('active');
            pw.value = '';
            pw.classList.remove('error');
            setTimeout(() => pw.focus(), 50);
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });

        function tryPassword() {
            if (pw.value.trim().toLowerCase() === 'coachman') {
                window.location.href = 'dm-screen.html';
            } else {
                pw.classList.add('error');
                setTimeout(() => pw.classList.remove('error'), 400);
            }
        }

        document.getElementById('submit-btn').addEventListener('click', tryPassword);
        pw.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryPassword();
        });

        const merchantOverlay = document.getElementById('merchant-overlay');
        const merchantPw = document.getElementById('merchant-pw');

        document.getElementById('merchant-btn').addEventListener('click', () => {
            merchantOverlay.classList.add('active');
            merchantPw.value = '';
            merchantPw.classList.remove('error');
            setTimeout(() => merchantPw.focus(), 50);
        });

        document.getElementById('merchant-cancel-btn').addEventListener('click', () => {
            merchantOverlay.classList.remove('active');
        });

        merchantOverlay.addEventListener('click', (e) => {
            if (e.target === merchantOverlay) merchantOverlay.classList.remove('active');
        });

        function tryMerchantPassword() {
            if (merchantPw.value.trim().toLowerCase() === 'spider') {
                window.location.href = 'spider-merchant.html';
            } else {
                merchantPw.classList.add('error');
                setTimeout(() => merchantPw.classList.remove('error'), 400);
            }
        }

        document.getElementById('merchant-submit-btn').addEventListener('click', tryMerchantPassword);
        merchantPw.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryMerchantPassword();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            overlay.classList.remove('active');
            merchantOverlay.classList.remove('active');
        });
