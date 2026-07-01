import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, Form, Input, Typography } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import loginHero from "@/assets/login/login-hero.webp";
import { getDefaultPathForTop } from "@/layout/menuConfig";
import styles from "./index.module.css";
import {
	type LoginFormValues,
	loadSavedCredentials,
	saveCredentials,
} from "./utils";

const Login = () => {
	const navigate = useNavigate();
	const [form] = Form.useForm<LoginFormValues>();

	useEffect(() => {
		const saved = loadSavedCredentials();
		if (saved) {
			form.setFieldsValue(saved);
		}
	}, []);

	const onFinish = (values: LoginFormValues) => {
		saveCredentials(values);
		navigate(getDefaultPathForTop("warning"));
	};

	return (
		<div className={styles.login}>
			<div className={styles.hero} aria-hidden>
				<img
					className={styles.heroImage}
					src={loginHero}
					alt=""
					draggable={false}
				/>
			</div>

			<div className={styles.panel}>
				<div className={styles.formWrap}>
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
							rules={[
								{ required: true, message: "请输入用户名" },
							]}
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

						<Flex className={styles.options} align="center">
							<Form.Item
								name="remember"
								valuePropName="checked"
								noStyle
							>
								<Checkbox className={styles.remember}>
									记住我
								</Checkbox>
							</Form.Item>
						</Flex>

						<Form.Item className={styles.submitItem}>
							<Button
								type="primary"
								htmlType="submit"
								block
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
