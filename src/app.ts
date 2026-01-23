import express from "express"
import routes from "./routes"

const PORT = 3000

const app = express()

app.use(routes)

app.listen(PORT, () => {
  console.log(`Server online on PORT ${PORT}`)
})
