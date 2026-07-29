import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Typography } from "antd";
import { useEffect } from "react";
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

const Login = () => {
	const navigate = useNavigate();
	const [form] = Form.useForm<LoginFormValues>();
	const login = useUserStore((state) => state.login);
	const loading = useUserStore((state) => state.loading);

	useEffect(() => {
		const saved = getRememberMe();
		if (saved) {
			form.setFieldsValue(saved);
		}
	}, []);

	const onFinish = async (values: LoginFormValues) => {
		const { username, password } = values;
		const ok = await login({ username, password });
		if (!ok) return;

		setRememberMe(values);
		navigate(DEFAULT_HOME_PATH);
	};

	return (
		<div className={styles.login} data-page="login">
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
								className={styles.input}
								size="large"
								prefix={<LockOutlined />}
								placeholder="请输入密码"
								maxLength={PASSWORD_MAX_LENGTH}
								autoComplete="current-password"
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
