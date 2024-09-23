const mongoose=require("mongoose")
const bcrypt=require("bcrypt")

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        match:[/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password:{
        type:String,
        required:true,
    }

})

UserSchema.pre('save', async ()=> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);  
});
const User=mongoose.model("registers",UserSchema)
module.exports=User;