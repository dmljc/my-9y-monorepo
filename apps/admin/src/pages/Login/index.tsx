import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, Form, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import loginHero from "@/assets/login/login-hero.webp";
import { getDefaultPathForTop } from "@/layout/menuConfig";
import { setToken } from "@/services/auth";
import { login } from "./api";
import styles from "./index.module.css";
import {
	type LoginFormValues,
	loadSavedCredentials,
	saveCredentials,
} from "./utils";

const Login = () => {
	const navigate = useNavigate();
	const { message } = App.useApp();
	const [form] = Form.useForm<LoginFormValues>();
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const saved = loadSavedCredentials();
		if (saved) {
			form.setFieldsValue(saved);
		}
	}, []);

	const onFinish = async (values: LoginFormValues) => {
		setSubmitting(true);
		try {
			const { username, password } = values;
			const data = await login({
				username,
				password,
			});
			if (data.code !== 200) {
				message.error("登录失败");
				return;
			}
			setToken(data.token);
			saveCredentials(values);
			navigate(getDefaultPathForTop("warning"));
		} catch {
			message.error("登录失败");
		} finally {
			setSubmitting(false);
		}
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
							loading={submitting}
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
