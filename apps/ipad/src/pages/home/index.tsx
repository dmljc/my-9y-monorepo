import { App } from "antd";
import { useNavigate } from "react-router-dom";
import homeBg from "@/assets/home/home-bg.webp";
import iconLogout from "@/assets/home/logout.svg";
import { useUserStore } from "@/stores/user";
import { hasPermission } from "@/utils";
import styles from "./index.module.css";
import { NAV_ITEMS, splitTitle } from "./utils";

const Home = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const logout = useUserStore((state) => state.logout);
	useUserStore((state) => state.permissions);
	const titleParts = splitTitle(import.meta.env.VITE_APP_TITLE);
	const navItems = NAV_ITEMS.filter((item) => hasPermission(item.perm));

	const handleNavClick = (path?: string) => {
		if (path) {
			navigate(path);
			return;
		}
		message.info("功能开发中");
	};

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<div className={styles.home} data-page="home">
			{/* 宽屏留白区：柔化延展，避免生硬色块；主构图仍在 contain 舞台内 */}
			<img
				className={styles.bgBleed}
				src={homeBg}
				alt=""
				aria-hidden
				draggable={false}
			/>

			{/* 1400×920 等比舞台：背景与导航同落舞台内，电脑端 contain 不裁切、不变形 */}
			<div className={styles.stage}>
				<img
					className={styles.bg}
					src={homeBg}
					alt=""
					aria-hidden
					draggable={false}
				/>

				<header className={styles.header}>
					<h1 className={styles.title}>
						<span className={styles.titleMain}>
							{titleParts.prefix}
						</span>
						{titleParts.accent ? (
							<span className={styles.titleAccent}>
								{titleParts.accent}
							</span>
						) : null}
						{titleParts.suffix ? (
							<span className={styles.titleMain}>
								{titleParts.suffix}
							</span>
						) : null}
					</h1>
				</header>

				<button
					type="button"
					className={styles.logoutBtn}
					onClick={() => {
						void handleLogout();
					}}
					aria-label="退出登录"
				>
					<img
						className={styles.logoutIcon}
						src={iconLogout}
						alt=""
						aria-hidden
						draggable={false}
					/>
					<span className={styles.logoutText}>退出登录</span>
				</button>

				<nav className={styles.navGrid} aria-label="功能入口">
					{navItems.map((item) => (
						<button
							key={item.key}
							type="button"
							className={styles.navCard}
							aria-label={item.label}
							onClick={() => handleNavClick(item.path)}
						>
							<img
								className={styles.navCardImg}
								src={item.card}
								alt=""
								aria-hidden
								draggable={false}
							/>
							<span className={styles.navLabel}>
								{item.label}
								<span className={styles.navArrow} aria-hidden>
									→
								</span>
							</span>
						</button>
					))}
				</nav>
			</div>
		</div>
	);
};

export default Home;
