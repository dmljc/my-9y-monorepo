import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Form, Input, Typography } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import loginBg from "@/assets/login/login-bg.webp";
import { DEFAULT_HOME_PATH } from "@/layout/menuConfig";
import { useUserStore } from "@/stores/user";
import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_RULES,
	USERNAME_MAX_LENGTH,
	USERNAME_RULES,
} from "./formRules";
import styles from "./index.module.css";
import type { LoginFormValues } from "./interface";
import { getRememberMe, setRememberMe } from "./utils";

const Login = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
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
		if (!ok) {
			message.error("登录失败，请重试");
			return;
		}

		setRememberMe(values);
		navigate(DEFAULT_HOME_PATH);
	};

	return (
		<div className={styles.login} data-page="login">
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
					<Form.Item name="username" rules={USERNAME_RULES}>
						<Input
							className={styles.input}
							size="large"
							prefix={<UserOutlined />}
							placeholder="请输入用户名"
							maxLength={USERNAME_MAX_LENGTH}
							autoComplete="username"
						/>
					</Form.Item>

					<Form.Item name="password" rules={PASSWORD_RULES}>
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
						<Checkbox className={styles.remember}>记住我</Checkbox>
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
	);
};

export default Login;
