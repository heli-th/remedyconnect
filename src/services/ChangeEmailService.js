// const { EmailSent } = require("../controller/UserController");

const { UserSchema } = require("../model/UserSchema");
const bycrypt = require("bcryptjs");
const { CodeSchema } = require("../model/CodeSchema");
const { tokenScehmaUser } = require("../model/tokenSchema");

const { userStoryEmailContent } = require("../utils/UserStoryEmailContent");

const verifyPasswordService = async (password, id) => {
  let findUser = await UserSchema.findOne({ _id: id });
  if (findUser) {
    if (await bycrypt.compare(password, findUser.password)) {
      return {
        find: true,
        message: "Correct Password",
      };
    } else {
      return {
        find: false,
        message: "Incorrect Password",
      };
    }
  } else {
    console.log("in else");
    return {
      find: false,
      message: "Incorrect Password",
    };
  }
};
const getVerficationCode = async (email, id) => {
  let findUserFromUserScema = await UserSchema.find({ email: email });
  let findUserFromTokenScema = await tokenScehmaUser.find({ email: email });
  if (
    findUserFromUserScema[0]?.email === email ||
    findUserFromTokenScema[0]?.email === email
  ) {
    return {
      find: false,
      message: "User already exists",
    };
  } else {
    let findUser = await UserSchema.findOne({ _id: id });

    if (findUser) {
      let code = generateSixDigitCode();
      console.log(code);

      const obj = {
        username:findUser?.firstName,
        paragraph:`We have received a request to change the email associated with your account. To ensure that this request was made by you, please enter the following verification code on the change email page: (${code}). If you did not request to change your email address, please ignore this message and contact our support team immediately.`,
        btnName:"RESET YOUR PASSWORD",
        // btnLink:`${process.env.LINK_EMAIL}/resetpassword?Token=${token}`,
        isHideBtn:true
      }
      // let emailContentType = "2FA_content";
      // let dynamicContent = {
      //   code: code,
      //   username: user.firstName,
      // };
      // let EmailContent = await makeEmailContent(emailContentType, dynamicContent);
      let htmlCon = userStoryEmailContent(obj)
      // let content ={
      //   firstName:findUser?.firstName,
      //   code:code
      // }
      // let emailcontent = makeEmailContent("change_email",content);
      let result = EmailSent(
        "Verify your email change request",
        email,
        htmlCon
      );
      if (result) {
        //save code in mongodb
        let saveCode = await SaveCodeInDB(id, code, email,codeType='change_email');
        console.log(saveCode);
        if (saveCode) {
          return { find: true, message: "Kindly check your email for code." };
        } else {
          return {
            find: false,
            message: "Something went wrong kindly try again later",
          };
        }
      }
    } else {
      return {
        find: false,
        message: " User not found",
      };
    }
  }
};
const verifyCode = async (id, code, email, customerId) => {
  console.log("email", email, id);

  let checkExpiry = await checkExpiryOfCode(id, code, email,codeType='change_email');
  if (checkExpiry) {
    let update = await updateEmail(id, email);
    if (update) {
      let updateStripeEmai = await updateStripeEmail(customerId, email);
      return {
        find: true,
        message: "Your Email has been succesfully updated",
      };
    }
  } else {
    return {
      find: false,
      message: "Something went wrong try again later",
    };
  }
};


//SIX DIGIT RANDOM CODE
function generateSixDigitCode() {
  const min = 100000;
  const max = 999999;
  const timestamp = new Date().getTime().toString();
  const random = Math.floor(Math.random() * (max - min + 1)) + min;
  const code = (timestamp.substr(-4) + random).substr(-6);
  return code;
}

//make email content
const makeEmailContentemail = (firstName, code) => {
  return (emailContent = `<div style="height:100%; width:100%;padding:5px;">
      <h1 style="color:black; margin-top:10px; margin-left:10px;">Market Alert <span style="color:#02BD2D;">Pro</span></h1>
      <p style="color:black; font-size:16px; margin-top:10px; margin-left:10px;">Hi ${firstName}!<br/><br/>We have received a request to change the email associated with your account. To ensure that this request was made by you, please enter the following verification code on the change email page:</p> 
      <h3 style="margin-left:10px;">${code}</h3></br></br>
      <p style="color:black; font-size:16px; margin-top:10px; margin-left:10px;">If you did not request to change your email address, please ignore this message and contact our support team immediately.</p><br></br>    
                            </div>`);
};
const appConfig = require("../appConfig")

//sent email
const EmailSent = async (subject, email, emailcontent) => {
  let result = await transporter.sendMail({
    to: email,
    cc:appConfig.adminEmail,
    from: {
      name: "Market Alert Pro",
      address: "accounts@marketalertpro.com",
    },
    subject: subject,
    html: `${emailcontent}   
      `,
  });
  if (result) {
    return true;
  }
};

//save in DB
const SaveCodeInDB = async (userId, code, email,codeType,token) => {
  //find and inactive all previous status before creating new
  if(codeType==="refresh_data"){
    let resultOfFind = await CodeSchema.updateMany(
      { codeType: codeType, email: email },
      { $set: { status: "inactive" } }
    );
  }
  else{
    let resultOfFind = await CodeSchema.updateMany(
      { codeType: codeType, UserId: userId },
      { $set: { status: "inactive" } }
    );
  }
  

  const currentDate = new Date();
  const expiryDate = new Date(currentDate.getTime() + 5 * 60000);
  let res = await CodeSchema.create({
    UserId: userId,
    Code: code,
    CreateDate: currentDate,
    ExpiryDate: expiryDate, //five minutes after,
    email: email,
    codeType: codeType,
    token:token
  });

  console.log("refresh",res)
  return res;
};


//checkExpiryOfCode
const checkExpiryOfCode = async (id, code, email,codeType) => {
  try {
    console.log("find of verify", email,codeType,code,new Date());
    let find;
    if(codeType==="refresh_data"){

       find = await CodeSchema.findOne({
        email: email,
        status: "active",
        ExpiryDate: { $gt: new Date() },
        codeType:codeType
      });
    }
    else{
      find = await CodeSchema.findOne({
       UserId: id,
       status: "active",
       ExpiryDate: { $gt: new Date() },
       codeType:codeType
     });
    }
    if (find) {
      if (
        find.Code === code &&
        find.status === "active" &&
        find.ExpiryDate > new Date() &&
        find.email === email
      ) {
        return true;
      } else {
        return false;
      }
    }
    else{
      return false
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};



//update email
const updateEmail = async (id, email) => {
  try {
    console.log("email,id", email, id);

    let findForTokenSchema = await UserSchema.findById(id);
    console.log("findForTokenSchema", findForTokenSchema);

    let updateEmailOfUser = await UserSchema.findOneAndUpdate(
      { _id: id },
      { email: email }
    );
    console.log("updateEmailOfUser", updateEmailOfUser);
    let updateEmailOfTokenSchema = await tokenScehmaUser.updateMany(
      { email: findForTokenSchema.email },
      { email: email }
    );
    // let updateEmailOfUserSchema = await User.updateMany({email:findForTokenSchema.email},{email:email});

    if (updateEmailOfUser) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    return false;
  }
};


const updateStripeEmail = async (customerId, newEmail) => {
  try {
    const customer = await getStripe().customers.update(customerId, {
      email: newEmail,
    });
    console.log("Email updated successfully:", customer.email);
    return customer;
  } catch (error) {
    throw error;
  }
};



module.exports = { verifyPasswordService, getVerficationCode, verifyCode,generateSixDigitCode,SaveCodeInDB,checkExpiryOfCode };
