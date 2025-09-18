import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { writeFile } from "@utils/fs"
import { GlobalFileNames, ensureRulesDirectoryExists } from "@/core/storage/disk"
import { PersonaProfile } from "@shared/proto/caret/persona"
import { Logger } from "@/services/logging/Logger"
import { SimplePersona, SimplePersonaImages } from "./simple-persona"
import { Controller } from "@core/controller"

export class PersonaStorage {
	public async getPersona(controller: Controller): Promise<SimplePersona> {
		const rulesDir = await ensureRulesDirectoryExists()
		const personaMdPath = path.join(rulesDir, GlobalFileNames.persona)
		let name = "Default"
		let description = "Default Persona"
		let customInstruction = "{}"

		try {
			const content = await fs.readFile(personaMdPath, "utf-8")
			const parsedContent = JSON.parse(content)
			name = parsedContent?.persona?.name || name
			description = parsedContent?.persona?.description || description
			customInstruction = content
		} catch (error) {
			Logger.warn(`[CARET-PERSONA] getPersona: Could not read or parse persona.md, using defaults. Error: ${error}`)
		}

		return { name, description, customInstruction }
	}

	public async loadSimplePersonaImages(controller: Controller): Promise<SimplePersonaImages | null> {
		try {
			// Load persona images from globalStorage file system
			const personaDir = path.join(controller.context.globalStorageUri.fsPath, "personas")
			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			const { fileExistsAtPath } = await import("@utils/fs")

			if (!(await fileExistsAtPath(profilePath)) || !(await fileExistsAtPath(thinkingPath))) {
				return null
			}

			const avatar = await fs.readFile(profilePath)
			const thinkingAvatar = await fs.readFile(thinkingPath)

			return { avatar, thinkingAvatar }
		} catch (error) {
			Logger.error(`Failed to load persona images: ${error}`)
			return null
		}
	}

	public async savePersonaProfile(controller: Controller, profile: PersonaProfile): Promise<void> {
		Logger.info(`Saving persona profile for: ${profile.name}`)
		try {
			const rulesDir = await ensureRulesDirectoryExists()
			const personaMdPath = path.join(rulesDir, "persona.md")

			await writeFile(personaMdPath, profile.customInstruction)
			Logger.debug(`Persona profile saved to ${personaMdPath}`)
		} catch (error) {
			Logger.error(`Failed to save persona profile: ${error}`)
			throw error
		}
	}

	public async savePersonaImages(controller: Controller, images: SimplePersonaImages): Promise<void> {
		try {
			// Save persona images to globalStorage file system
			const personaDir = path.join(controller.context.globalStorageUri.fsPath, "personas")

			await fs.mkdir(personaDir, { recursive: true })

			const profilePath = path.join(personaDir, "agent_profile.png")
			const thinkingPath = path.join(personaDir, "agent_thinking.png")

			await fs.writeFile(profilePath, images.avatar)
			await fs.writeFile(thinkingPath, images.thinkingAvatar)
		} catch (error) {
			Logger.error(`Failed to save persona images: ${error}`)
			throw error
		}
	}
}
