import { Hono } from 'hono'
import prompts from './routes/prompts.js'

const app = new Hono()

app.route('/prompts', prompts)

export default app
