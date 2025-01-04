import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type HttpServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';

function setupSocketIOServer(httpServer: HttpServer | null) {
	if (!httpServer) {
		throw new Error('HTTP server is not available');
	}
	const io = new SocketIOServer(httpServer);
	io.on('connection', (socket) => {
		console.log(`[ws] client connected (${socket.id})`);
		io.emit('message', `Hello from SvelteKit ${new Date().toLocaleString()} (${socket.id})`);

		socket.on('disconnect', () => {
			io.emit(`[ws] client disconnected (${socket.id})`);
		});
	});
}

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'integratedSocketIOServer',
			configureServer(server) {
				setupSocketIOServer(server.httpServer);
			},
			configurePreviewServer(server) {
				setupSocketIOServer(server.httpServer);
			}
		},
	]
});