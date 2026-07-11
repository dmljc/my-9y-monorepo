import { App } from "antd";
import { useNavigate } from "react-router-dom";
import homeBg from "@/assets/home/home-bg.webp";
import styles from "./index.module.css";
import { HOME_NAV_ITEMS, splitHomeTitle } from "./utils";

const Home = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const titleParts = splitHomeTitle(
		import.meta.env.VITE_APP_TITLE || "XXXX孪生平台",
	);

	const handleNavClick = (path?: string) => {
		if (path) {
			navigate(path);
			return;
		}
		message.info("功能开发中");
	};

	return (
		<div className={styles.home} data-page="home">
			{/* 设计稿整页背景（标题区已掩码，卡片/装饰 1:1） */}
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

			{/* 透明热区：对齐设计稿卡片坐标，承载点击 */}
			<div className={styles.navGrid}>
				{HOME_NAV_ITEMS.map((item) => (
					<button
						key={item.key}
						type="button"
						className={styles.navHit}
						aria-label={item.label}
						onClick={() => handleNavClick(item.path)}
					/>
				))}
			</div>
		</div>
	);
};

export default Home;
