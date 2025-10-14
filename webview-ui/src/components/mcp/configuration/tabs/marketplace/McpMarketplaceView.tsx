import { EmptyRequest } from "@shared/proto/cline/common"
import {
	VSCodeButton,
	VSCodeDropdown,
	VSCodeOption,
	VSCodeProgressRing,
	VSCodeRadio,
	VSCodeRadioGroup,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { useEffect, useMemo, useState } from "react"
import { t } from "@/caret/utils/i18n"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { McpServiceClient } from "@/services/grpc-client"
import McpMarketplaceCard from "./McpMarketplaceCard"
import McpSubmitCard from "./McpSubmitCard"

const McpMarketplaceView = () => {
	const { mcpServers, mcpMarketplaceCatalog, setMcpMarketplaceCatalog, mcpMarketplaceEnabled } = useExtensionState()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<"newest" | "stars" | "name" | "downloadCount">("newest")

	const items = mcpMarketplaceCatalog?.items || []

	const categories = useMemo(() => {
		const uniqueCategories = new Set(items.map((item) => item.category))
		return Array.from(uniqueCategories).sort()
	}, [items])

	const filteredItems = useMemo(() => {
		return items
			.filter((item) => {
				const matchesSearch =
					searchQuery === "" ||
					item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
				const matchesCategory = !selectedCategory || item.category === selectedCategory
				return matchesSearch && matchesCategory
			})
			.sort((a, b) => {
				switch (sortBy) {
					case "downloadCount":
						return b.downloadCount - a.downloadCount
					case "stars":
						return b.githubStars - a.githubStars
					case "name":
						return a.name.localeCompare(b.name)
					case "newest":
						return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					default:
						return 0
				}
			})
	}, [items, searchQuery, selectedCategory, sortBy])

	useEffect(() => {
		// Fetch marketplace catalog on initial load
		fetchMarketplace()
	}, [])

	useEffect(() => {
		// Update loading state when catalog arrives
		if (mcpMarketplaceCatalog?.items) {
			setIsLoading(false)
			setIsRefreshing(false)
			setError(null)
		}
	}, [mcpMarketplaceCatalog])

	const fetchMarketplace = (forceRefresh: boolean = false) => {
		if (forceRefresh) {
			setIsRefreshing(true)
		} else {
			setIsLoading(true)
		}
		setError(null)

		if (mcpMarketplaceEnabled) {
			McpServiceClient.refreshMcpMarketplace(EmptyRequest.create({}))
				.then((response) => {
					setMcpMarketplaceCatalog(response)
				})
				.catch((error) => {
					console.error("Error refreshing MCP marketplace:", error)
					setError(t("mcpMarketplaceView.failedToLoadMarketplaceData", "chat"))
					setIsLoading(false)
					setIsRefreshing(false)
				})
		}
	}

	if (isLoading || isRefreshing) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					padding: "20px",
				}}>
				<VSCodeProgressRing />
			</div>
		)
	}

	if (error) {
		return (
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
					padding: "20px",
					gap: "12px",
				}}>
				<div style={{ color: "var(--vscode-errorForeground)" }}>{error}</div>
				<VSCodeButton appearance="secondary" onClick={() => fetchMarketplace(true)}>
					<span className="codicon codicon-refresh" style={{ marginRight: "6px" }} />
					{t("mcpMarketplaceView.retry", "chat")}
				</VSCodeButton>
			</div>
		)
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
			}}>
			<div style={{ padding: "20px 20px 5px", display: "flex", flexDirection: "column", gap: "16px" }}>
				{/* Search row */}
				<VSCodeTextField
					onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
					placeholder={t("mcpMarketplaceView.searchMcps", "chat")}
					style={{ width: "100%" }}
					value={searchQuery}>
					<div
						className="codicon codicon-search"
						slot="start"
						style={{
							fontSize: 13,
							opacity: 0.8,
						}}
					/>
					{searchQuery && (
						<div
							aria-label={t("mcpMarketplaceView.clearSearch", "chat")}
							className="codicon codicon-close"
							onClick={() => setSearchQuery("")}
							slot="end"
							style={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								height: "100%",
								cursor: "pointer",
							}}
						/>
					)}
				</VSCodeTextField>

				{/* Filter row */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
					}}>
					<span
						style={{
							fontSize: "11px",
							color: "var(--vscode-descriptionForeground)",
							textTransform: "uppercase",
							fontWeight: 500,
							flexShrink: 0,
						}}>
						{t("mcpMarketplaceView.filter", "chat")}:
					</span>
					<div
						style={{
							position: "relative",
							zIndex: 2,
							flex: 1,
						}}>
						<VSCodeDropdown
							onChange={(e) => setSelectedCategory((e.target as HTMLSelectElement).value || null)}
							style={{
								width: "100%",
							}}
							value={selectedCategory || ""}>
							<VSCodeOption value="">{t("mcpMarketplaceView.allCategories", "chat")}</VSCodeOption>
							{categories.map((category) => (
								<VSCodeOption key={category} value={category}>
									{category}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
				</div>

				{/* Sort row */}
				<div
					style={{
						display: "flex",
						gap: "8px",
					}}>
					<span
						style={{
							fontSize: "11px",
							color: "var(--vscode-descriptionForeground)",
							textTransform: "uppercase",
							fontWeight: 500,
							marginTop: "3px",
						}}>
						{t("mcpMarketplaceView.sort", "chat")}:
					</span>
					<VSCodeRadioGroup
						onChange={(e) => setSortBy((e.target as HTMLInputElement).value as typeof sortBy)}
						style={{
							display: "flex",
							flexWrap: "wrap",
							marginTop: "-2.5px",
						}}
						value={sortBy}>
						<VSCodeRadio value="downloadCount">{t("mcpMarketplaceView.mostInstalls", "chat")}</VSCodeRadio>
						<VSCodeRadio value="newest">{t("mcpMarketplaceView.newest", "chat")}</VSCodeRadio>
						<VSCodeRadio value="stars">{t("mcpMarketplaceView.githubStars", "chat")}</VSCodeRadio>
						<VSCodeRadio value="name">{t("mcpMarketplaceView.name", "chat")}</VSCodeRadio>
					</VSCodeRadioGroup>
				</div>
			</div>

			<style>
				{`
				.mcp-search-input,
				.mcp-select {
				box-sizing: border-box;
				}
				.mcp-search-input {
				min-width: 140px;
				}
				.mcp-search-input:focus,
				.mcp-select:focus {
				border-color: var(--vscode-focusBorder) !important;
				}
				.mcp-search-input:hover,
				.mcp-select:hover {
				opacity: 0.9;
				}
			`}
			</style>
			<div style={{ display: "flex", flexDirection: "column" }}>
				{filteredItems.length === 0 ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
							padding: "20px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						{searchQuery || selectedCategory
							? t("mcpMarketplaceView.noMatchingMcpServersFound", "chat")
							: t("mcpMarketplaceView.noMcpServersFoundInMarketplace", "chat")}
					</div>
				) : (
					filteredItems.map((item) => (
						<McpMarketplaceCard installedServers={mcpServers} item={item} key={item.mcpId} setError={setError} />
					))
				)}
				<McpSubmitCard />
			</div>
		</div>
	)
}

export default McpMarketplaceView
