import { App } from "antd";
import { useNavigate } from "react-router-dom";
import homeBg from "@/assets/home/home-bg.webp";
import styles from "./index.module.css";
import { NAV_ITEMS, splitTitle } from "./utils";

const Home = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const titleParts = splitTitle(import.meta.env.VITE_APP_TITLE);

	const handleNavClick = (path?: string) => {
		if (path) {
			navigate(path);
			return;
		}
		message.info("功能开发中");
	};

	return (
		<div className={styles.home} data-page="home">
			{/* 背景图铺满视口；内容等比由舞台 `.stage` 控制，避免裁切 */}
			<img
				className={styles.bg}
				src={homeBg}
				alt=""
				aria-hidden
				draggable={false}
			/>

			{/* 1400×920 等比舞台：在任意视口内 contain，保证内容完整显示 */}
			<div className={styles.stage}>
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

				<nav className={styles.navGrid} aria-label="功能入口">
					{NAV_ITEMS.map((item) => (
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
