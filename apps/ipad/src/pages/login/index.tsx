import LockOutlined from "@ant-design/icons/LockOutlined";
import UserOutlined from "@ant-design/icons/UserOutlined";
import { Button, Checkbox, Form, Input, Typography } from "antd";
import type { InputRef } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import loginBg from "@/assets/login/login-bg.webp";
import { DEFAULT_HOME_PATH } from "@/layout/menuConfig";
import { useUserStore } from "@/stores/user";
import styles from "./index.module.css";
import type { LoginFormValues } from "./interface";
import {
	getRememberMe,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	PASSWORD_PATTERN,
	setRememberMe,
	USERNAME_MAX_LENGTH,
	USERNAME_PATTERN,
} from "./utils";

/**
 * 当前焦点是否在登录输入框内（含密码框小眼睛等附属控件）。
 */
const isLoginTextFocus = (target: EventTarget | null) => {
	if (!(target instanceof Element)) {
		return false;
	}
	if (target instanceof HTMLTextAreaElement) {
		return true;
	}
	if (target instanceof HTMLInputElement) {
		return (
			target.type !== "checkbox" &&
			target.type !== "radio" &&
			target.type !== "button" &&
			target.type !== "submit"
		);
	}
	return Boolean(target.closest(".ant-input-affix-wrapper"));
};

const Login = () => {
	const navigate = useNavigate();
	const [form] = Form.useForm<LoginFormValues>();
	const login = useUserStore((state) => state.login);
	const loading = useUserStore((state) => state.loading);
	const loginRef = useRef<HTMLDivElement | null>(null);
	const passwordRef = useRef<InputRef | null>(null);
	const [keyboardOpen, setKeyboardOpen] = useState(false);
	const largestViewportHeightRef = useRef(0);

	useEffect(() => {
		const saved = getRememberMe();
		if (saved) {
			form.setFieldsValue(saved);
		}
	}, []);

	/**
	 * HarmonyOS 浏览器唤起软键盘会缩短 visualViewport。
	 * 将登录页贴齐可视区域，避免 contain 舞台随剩余高度整体缩小。
	 */
	useEffect(() => {
		const root = loginRef.current;
		const viewport = window.visualViewport;
		if (!root) {
			return;
		}

		let blurTimer = 0;
		const syncViewportBox = () => {
			if (!viewport) {
				root.style.width = "";
				root.style.height = "";
				root.style.left = "";
				root.style.top = "";
				root.style.right = "";
				root.style.bottom = "";
				return;
			}
			root.style.width = `${viewport.width}px`;
			root.style.height = `${viewport.height}px`;
			root.style.left = `${viewport.offsetLeft}px`;
			root.style.top = `${viewport.offsetTop}px`;
			root.style.right = "auto";
			root.style.bottom = "auto";
		};

		const updateKeyboardState = () => {
			const visibleHeight = viewport?.height ?? window.innerHeight;
			largestViewportHeightRef.current = Math.max(
				largestViewportHeightRef.current,
				visibleHeight,
			);
			const focused = isLoginTextFocus(document.activeElement);
			const shrunk =
				largestViewportHeightRef.current - visibleHeight > 120;
			window.clearTimeout(blurTimer);
			if (focused && shrunk) {
				setKeyboardOpen(true);
			} else if (!focused) {
				blurTimer = window.setTimeout(() => {
					if (!isLoginTextFocus(document.activeElement)) {
						setKeyboardOpen(false);
					}
				}, 180);
			} else {
				setKeyboardOpen(false);
			}
			syncViewportBox();
		};

		largestViewportHeightRef.current =
			viewport?.height ?? window.innerHeight;
		syncViewportBox();
		updateKeyboardState();

		viewport?.addEventListener("resize", updateKeyboardState);
		viewport?.addEventListener("scroll", updateKeyboardState);
		window.addEventListener("resize", updateKeyboardState);
		document.addEventListener("focusin", updateKeyboardState);
		document.addEventListener("focusout", updateKeyboardState);
		return () => {
			window.clearTimeout(blurTimer);
			viewport?.removeEventListener("resize", updateKeyboardState);
			viewport?.removeEventListener("scroll", updateKeyboardState);
			window.removeEventListener("resize", updateKeyboardState);
			document.removeEventListener("focusin", updateKeyboardState);
			document.removeEventListener("focusout", updateKeyboardState);
			root.style.width = "";
			root.style.height = "";
			root.style.left = "";
			root.style.top = "";
			root.style.right = "";
			root.style.bottom = "";
		};
	}, []);

	const onFinish = async (values: LoginFormValues) => {
		const { username, password } = values;
		const ok = await login({ username, password });
		if (!ok) return;

		setRememberMe(values);
		navigate(DEFAULT_HOME_PATH);
	};

	return (
		<div
			ref={loginRef}
			className={styles.login}
			data-page="login"
			data-keyboard-open={keyboardOpen || undefined}
		>
			{/* 宽屏留白区：柔化延展，避免生硬色块；主构图仍在 contain 舞台内 */}
			<img
				className={styles.bgBleed}
				src={loginBg}
				alt=""
				aria-hidden
				draggable={false}
			/>

			{/* 1400×920 等比舞台：背景与表单同落舞台内，电脑端 contain 不裁切、不变形 */}
			<div className={styles.stage}>
				<img
					className={styles.bgImage}
					src={loginBg}
					alt=""
					aria-hidden
					draggable={false}
				/>

				<div className={styles.panel}>
					<Typography.Title level={2} className={styles.title}>
						{import.meta.env.VITE_APP_TITLE}
					</Typography.Title>

					<Form<LoginFormValues>
						form={form}
						className={styles.form}
						layout="vertical"
						requiredMark={false}
						initialValues={{ remember: true }}
						onFinish={onFinish}
					>
						<Form.Item
							name="username"
							validateFirst
							rules={[
								{
									required: true,
									whitespace: true,
									message: "请输入用户账号",
								},
								{
									max: USERNAME_MAX_LENGTH,
									message: `最多输入${USERNAME_MAX_LENGTH}个字符`,
								},
								{
									pattern: USERNAME_PATTERN,
									message: "可以包含大小写字母、数字、@",
								},
							]}
						>
							<Input
								className={styles.input}
								size="large"
								prefix={<UserOutlined />}
								placeholder="请输入用户名"
								maxLength={USERNAME_MAX_LENGTH}
								autoComplete="username"
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
								enterKeyHint="next"
								onPressEnter={(event) => {
									event.preventDefault();
									passwordRef.current?.focus({
										cursor: "end",
									});
								}}
							/>
						</Form.Item>

						<Form.Item
							name="password"
							validateFirst
							rules={[
								{ required: true, message: "请输入密码" },
								{
									min: PASSWORD_MIN_LENGTH,
									max: PASSWORD_MAX_LENGTH,
									message: "密码长度必须在5到20个字符之间",
								},
								{
									pattern: PASSWORD_PATTERN,
									message:
										"仅支持字母、数字及常见符号 !@#$%^&*._-",
								},
							]}
						>
							<Input.Password
								ref={passwordRef}
								className={styles.input}
								size="large"
								prefix={<LockOutlined />}
								placeholder="请输入密码"
								maxLength={PASSWORD_MAX_LENGTH}
								autoComplete="current-password"
								enterKeyHint="go"
								onPressEnter={(event) => {
									event.preventDefault();
									if (!loading) {
										form.submit();
									}
								}}
							/>
						</Form.Item>

						<Form.Item
							name="remember"
							valuePropName="checked"
							className={styles.options}
						>
							<Checkbox className={styles.remember}>
								记住我
							</Checkbox>
						</Form.Item>

						<Form.Item className={styles.submitItem}>
							<Button
								type="primary"
								htmlType="submit"
								block
								loading={loading}
								className={styles.submit}
							>
								登录
							</Button>
						</Form.Item>
					</Form>
				</div>
			</div>
		</div>
	);
};

export default Login;
