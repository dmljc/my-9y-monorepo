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
