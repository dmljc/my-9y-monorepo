import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Typography } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import loginHero from "@/assets/login/login-hero.webp";
import { getDefaultPathForTop } from "@/layout/menuConfig";
import { useUserStore } from "@/stores/user";
import styles from "./index.module.css";
import type { LoginFormValues } from "./interface";
import { getRememberMe, setRememberMe } from "./utils";

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
		navigate(getDefaultPathForTop("warning"));
	};

	return (
		<div className={styles.login} data-page="login">
			<img
				className={styles.heroImage}
				src={loginHero}
				alt=""
				aria-hidden
				draggable={false}
			/>

			<div className={styles.panel}>
				<Typography.Title level={2} className={styles.title}>
					欢迎回来
				</Typography.Title>
				<Typography.Text className={styles.subtitle}>
					请使用您的账号登录系统
				</Typography.Text>

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
						rules={[{ required: true, message: "请输入用户名" }]}
					>
						<Input
							className={styles.input}
							size="large"
							prefix={<UserOutlined />}
							placeholder="请输入用户名"
							autoComplete="username"
						/>
					</Form.Item>

					<Form.Item
						name="password"
						rules={[{ required: true, message: "请输入密码" }]}
					>
						<Input.Password
							className={styles.input}
							size="large"
							prefix={<LockOutlined />}
							placeholder="请输入密码"
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
