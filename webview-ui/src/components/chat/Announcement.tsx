import { Accordion, AccordionItem } from "@heroui/react"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { CSSProperties, memo } from "react"
import { t } from "@/caret/utils/i18n"
import { getAsVar, VSC_DESCRIPTION_FOREGROUND, VSC_INACTIVE_SELECTION_BACKGROUND } from "@/utils/vscStyles"
import packageJson from "../../../../package.json"

interface AnnouncementProps {
	hideAnnouncement: () => void
}

const containerStyle: CSSProperties = {
	backgroundColor: getAsVar(VSC_INACTIVE_SELECTION_BACKGROUND),
	borderRadius: "3px",
	padding: "12px 16px",
	margin: "5px 15px 5px 15px",
	position: "relative",
	flexShrink: 0,
}
const closeIconStyle: CSSProperties = { position: "absolute", top: "8px", right: "8px" }
const h3TitleStyle: CSSProperties = { margin: "0 0 8px" }
const ulStyle: CSSProperties = { margin: "0 0 8px", paddingLeft: "12px" }
const _accountIconStyle: CSSProperties = { fontSize: 11 }
const hrStyle: CSSProperties = {
	height: "1px",
	background: getAsVar(VSC_DESCRIPTION_FOREGROUND),
	opacity: 0.1,
	margin: "8px 0",
}
const linkContainerStyle: CSSProperties = { margin: "0" }
const linkStyle: CSSProperties = { display: "inline" }

/*
Announcements are automatically shown when the major.minor version changes (for ex 3.19.x → 3.20.x or 4.0.x). 
The latestAnnouncementId is now automatically generated from the extension's package.json version. 
Patch releases (3.19.1 → 3.19.2) will not trigger new announcements.
*/
const Announcement = ({ hideAnnouncement }: AnnouncementProps) => {
	const minorVersion = packageJson.version.split(".").slice(0, 2).join(".") // 2.0.0 -> 2.0
	return (
		<div style={containerStyle}>
			<VSCodeButton appearance="icon" data-testid="close-button" onClick={hideAnnouncement} style={closeIconStyle}>
				<span className="codicon codicon-close"></span>
			</VSCodeButton>
			<h3 style={h3TitleStyle}>{t("announcement.newVersion", "common", { version: minorVersion })}</h3>
			<ul style={ulStyle}>
				<li>
					<b>{t("bullets.current.1", "announcement")}:</b> {t("bullets.current.1-desc", "announcement")}
				</li>
				<li>
					<b>{t("bullets.current.2", "announcement")}:</b> {t("bullets.current.2-desc", "announcement")}
				</li>
				<li>
					<b>{t("bullets.current.3", "announcement")}:</b> {t("bullets.current.3-desc", "announcement")}
				</li>
				<li>
					<b>{t("bullets.current.4", "announcement")}:</b>{" "}
					<VSCodeLink href="https://docs.caret.team/ko/getting-started/what-is-caret" style={linkStyle}>
						{t("links.korean", "announcement")}
					</VSCodeLink>
					{" / "}
					<VSCodeLink href="https://docs.caret.team/ja/getting-started/what-is-caret" style={linkStyle}>
						{t("links.japanese", "announcement")}
					</VSCodeLink>
					{" / "}
					<VSCodeLink href="https://docs.caret.team/zh/getting-started/what-is-caret" style={linkStyle}>
						{t("links.chinese", "announcement")}
					</VSCodeLink>
					{" / "}
					<VSCodeLink href="https://docs.caret.team/en/getting-started/what-is-caret" style={linkStyle}>
						{t("links.english", "announcement")}
					</VSCodeLink>
				</li>
				<li>
					<b>{t("bullets.current.5", "announcement")}:</b> {t("bullets.current.5-desc", "announcement")}
				</li>
			</ul>
			<Accordion className="pl-0">
				<AccordionItem
					aria-label={t("announcement.previousUpdates", "common")}
					classNames={{
						trigger: "bg-transparent border-0 pl-0 pb-0 w-fit",
						title: "font-bold text-[var(--vscode-foreground)]",
						indicator:
							"text-[var(--vscode-foreground)] mb-0.5 -rotate-180 data-[open=true]:-rotate-90 rtl:rotate-0 rtl:data-[open=true]:-rotate-90",
					}}
					key="1"
					title={t("announcement.previousUpdates", "common")}>
					<ul style={ulStyle}>
						<li>
							<b>{t("bullets.previous.1", "announcement")}:</b> {t("bullets.previous.1-desc", "announcement")}
						</li>
						<li>
							<b>{t("bullets.previous.2", "announcement")}:</b> {t("bullets.previous.2-desc", "announcement")}
						</li>
						<li>
							<b>{t("bullets.previous.3", "announcement")}:</b> {t("bullets.previous.3-desc", "announcement")}
						</li>
						<li>
							<b>{t("bullets.previous.4", "announcement")}:</b> {t("bullets.previous.4-desc", "announcement")}
						</li>
					</ul>
				</AccordionItem>
			</Accordion>
			<div style={hrStyle} />
		</div>
	)
}

export default memo(Announcement)
