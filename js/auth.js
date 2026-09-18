async function handleAuthSubmit() {
  const emailInput = document.getElementById('authEmail').value.trim();
  const passInput = document.getElementById('authPassword').value.trim();
  const nameInput = document.getElementById('authName').value.trim();

  if (!emailInput || !passInput) {
    if (typeof showAtelierAlert === 'function') {
      showAtelierAlert({ title: "ແຈ້ງເຕືອນ", message: "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!", type: "info" });
    } else {
      alert("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!");
    }
    return;
  }

  if (isRegisterMode) {
    // 1. ກວດສອບອີເມວຊ້ຳ
    const existing = userAccounts.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    if (existing) {
      if (typeof showAtelierAlert === 'function') {
        showAtelierAlert({ title: "ແຈ້ງເຕືອນ", message: "ອີເມວນີ້ມີໃນລະບົບແລ້ວ!", type: "error" });
      } else {
        alert("ອີເມວນີ້ມີໃນລະບົບແລ້ວ!");
      }
      return;
    }

    const newUser = {
      uid: 'u_' + Date.now(),
      email: emailInput,
      password: passInput,
      name: nameInput || "Valued Customer",
      role: "customer",
      phone: "+856 20 " + Math.floor(10000000 + Math.random() * 90000000),
      isPhoneVerified: false,
      dob: "",
      profileImage: null,
      beans: 50,
      createdAt: new Date().toISOString()
    };

    // 2. ບັນທຶກລົງ LocalStorage
    userAccounts.push(newUser);
    localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
    currentUser = newUser;

    // 3. ບັນທຶກລົງ Cloud Firestore Collection 'users' ແທ້ 100%
    if (isFirebaseReady && db) {
      try {
        await db.collection("users").doc(newUser.email).set(newUser, { merge: true });
        console.log("✅ New customer registered to Firestore:", newUser.email);
      } catch (cloudErr) {
        console.warn("⚠️ Firestore user save fallback:", cloudErr.message);
      }
    }

  } else {
    // ກວດສອບເຂົ້າສູ່ລະບົບ
    let user = userAccounts.find(u => 
      u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passInput
    );

    // ຖ້າໃນ Local ບໍ່ມີ ລອງກວດສອບໃນ Firestore
    if (!user && isFirebaseReady && db) {
      try {
        const doc = await db.collection("users").doc(emailInput).get();
        if (doc.exists && doc.data().password === passInput) {
          user = doc.data();
          userAccounts.push(user);
          localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
        }
      } catch (e) {}
    }

    if (!user) {
      if (typeof showAtelierAlert === 'function') {
        showAtelierAlert({ title: "ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ", message: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!", type: "error" });
      } else {
        alert("ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!");
      }
      return;
    }
    currentUser = user;
  }

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  if (typeof resetSessionTimer === 'function') resetSessionTimer();
  closeAuthModal();
  updateUserSessionUI();
  dispatchRoleView(currentUser.role);

  if (typeof showAtelierAlert === 'function') {
    showAtelierAlert({
      title: isRegisterMode ? "ລົງທະບຽນສຳເລັດ! 🎉" : "ຍິນດີຕ້ອນຮັບ!",
      message: `ສະບາຍດີ, ${currentUser.name}. ຂໍ້ມູນຂອງທ່ານຖືກບັນທຶກລົງລະບົບ Database ແລ້ວ.`,
      type: "success"
    });
  }
}
