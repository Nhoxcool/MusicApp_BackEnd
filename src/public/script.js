const getById = (id) => {
    return document.getElementById(id);
  };
  
  const password = getById("password");
  const confirmPassword = getById("confirm-password");
  const form = getById("form");
  const container = getById("container");
  const loader = getById("loader");
  const button = getById("submit");
  const error = getById("error");
  const success = getById("success");
  
  error.style.display = "none";
  success.style.display = "none";
  container.style.display = "none";
  
  let token, userId;

  const passChar = /^(?=.*[a-z])/;
  const passUp = /^(?=.*[A-Z])/;
  const passNum = /^(?=.*\d)/;
  const passSign = /^(?=.*[@$!%*?&])/;
  const passLenght = /^[A-Za-z\d@$!%*?&]{8,}$/;
  
  window.addEventListener("DOMContentLoaded", async () => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => {
        return searchParams.get(prop);
      },
    });
    token = params.token;
    userId = params.userId;
  
    const res = await fetch("/auth/verify-pass-reset-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        token,
        userId,
      }),
    });
  
    if (!res.ok) {
      const { error } = await res.json();
      loader.innerText = error;
      return;
    }
  
    loader.style.display = "none";
    container.style.display = "block";
  });

  const displayError = (errorMessage) => {
    success.style.display = "none";
    error.innerText = errorMessage
    error.style.display = "block";
  }
  
  const displaySuccess = (successMessage) => {
    error.style.display = "none";
    success.innerText = successMessage
    success.style.display = "block";
  }
  
  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if(!password.value.trim()){
        return displayError("Mật khâu đang bị thiếu!");
    }
    if(!passChar.test(password.value)) {
        return displayError("Mật khẩu phải có ít nhất 1 chữ cái thường!");
    }
    else if (!passUp.test(password.value)) {
        return displayError("Mật khẩu phải có ít nhất 1 chữ cái viết Hoa!");
    }
    else if (!passNum.test(password.value)) {
        return displayError("Mật khẩu phải có ít nhất 1 chữ số!");
    }
    else if (!passSign.test(password.value)) {
        return displayError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt!");
    }
    else if (!passLenght.test(password.value)) {
        return displayError("Mật khẩu phải có ít nhất 8 chữ số!");
    }
    
    if(password.value !== confirmPassword.value) {
        return displayError("Mật khẩu nhập lại không trùng khớp!")
    }

    button.disabled = true
    button.innerText = "Vui lòng chờ..."

    const res = await fetch("/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify({
          token,
          userId,
          password: password.value
        }),
      });

      button.disabled = false
      button.innerText = "Đặt lại mật khẩu"

      if (!res.ok) {
        const { error } = await res.json();
        return displayError(error);
      }

      displaySuccess("Mật khẩu đã được đặt lại thành công!")
      password.value = "";
      confirmPassword.value = "";
  }

  form.addEventListener("submit",handleSubmit);
  