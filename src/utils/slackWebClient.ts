import core from '@actions/core'
import { WebClient } from '@slack/web-api'

export const slackWebClient = new WebClient(core.getInput("bot-token"));

