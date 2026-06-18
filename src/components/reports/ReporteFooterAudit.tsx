import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { User } from '../../modules/Administracion/Usuarios/types/auth.type';
// Importamos la interfaz de tu estructura si la tienes expuesta, o la manejamos tipada aquí

const styles = StyleSheet.create({
    footerContainer: {
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
        paddingTop: 6,
        marginTop: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textAudit: {
        fontSize: 8,
        color: '#9ca3af',
        fontStyle: 'italic',
    }
});

interface FooterAuditProps {
    usuarioName?: string;
}

export const ReporteFooterAudit: React.FC<FooterAuditProps> = ({ usuarioName }) => {

    // Capturamos la fecha y hora exacta del momento de renderizado en formato boliviano
    const fechaHoraGeneracion = new Date().toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Extracción segura basada exactamente en tu interfaz de Local Storage
    const obtenerOperador = (): string => {
        if (usuarioName) return usuarioName;

        try {
            const userStorage = localStorage.getItem('user');
            if (userStorage) {
                // Parseamos el objeto mapeándolo a tu interfaz User
                const userObj: User = JSON.parse(userStorage);

                // Verificamos si la propiedad "persona" existe para armar el nombre real
                if (userObj.persona && userObj.persona.nombres) {
                    const primerApellido = userObj.persona.p_apellido || '';
                    const segundoApellido = userObj.persona.s_apellido || '';
                    const nombres = userObj.persona.nombres || '';
                    return `${nombres} ${primerApellido} ${segundoApellido}`.trim();
                }

                // Fallback 1: Si no hay objeto persona, usamos el "name" de la cuenta (username)
                if (userObj.name) return userObj.name;
            }
        } catch (e) {
            console.error("Error al leer el usuario tipado para el footer del PDF", e);
        }

        return 'Sistema Kantuta POS';
    };

    return (
        <View style={styles.footerContainer} wrap={false}>
            <Text style={styles.textAudit}>
                Generado por el operador: {obtenerOperador()}
            </Text>
            <Text style={styles.textAudit}>
                Fecha y hora de impresión: {fechaHoraGeneracion}
            </Text>
        </View>
    );
};