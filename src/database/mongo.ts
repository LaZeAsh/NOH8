import mongoose from 'mongoose'

export async function mongo() {
//   const options = {
//     useNewUrlParser:true,
//     useUnifiedTopology:true,
//     useCreateIndex:true,
//     useFindAndModify: false,
//   }

/*Unsupported in the newest version of mongodb*/
mongoose.connect(process.env.MONGO_DB_KEY as string, {
    keepAlive: true,
  }).then(() => console.log(`MongoDB is connected`))

}

export default mongo;